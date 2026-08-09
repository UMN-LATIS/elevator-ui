import * as T from "@/types";
import {
  clearUploadRegenerationFlags,
  diffEditableFields,
  makeNewLocalAsset,
  migrateAssetToTemplate,
  wouldSaveChangeStoredAsset,
} from "./localAsset";
import { omit } from "ramda";

/**
 * One page has one model holding every open editing session: the page's own
 * (the root) plus one per mounted inline related asset, keyed by SessionKey.
 * A session is one opening of one asset for editing, so a route change or a
 * remount opens a new session under a new key.
 *
 * A session holds identities and edits only. The asset baseline and the
 * template live in the query cache under the ids the session names, and the
 * arms that need a document receive it as event input, never store it. What
 * the user sees is the baseline with `edits` laid over it
 * (`selectLocalAsset`). Drafts keep their whole document, because a draft
 * has no server copy for the cache to own.
 *
 * Late async results are dropped by checking identity, not a counter. Every
 * event carries the sessionKey it is about, and resolution events carry
 * back the id of the thing they answer: the templateId a template document
 * answers, the assetId a baseline is for. A resolution for a session that
 * has closed, or for a thing the session no longer awaits, simply fails its
 * comparison.
 */
export type SessionKey = string;

/**
 * Where an inline child hangs in its parent's document: the related-asset
 * item whose targetAssetId the child's create fills in.
 */
export interface ParentLink {
  sessionKey: SessionKey;
  fieldTitle: string;
  itemUuid: string;
}

export type EditSession =
  | {
      status: "awaitingTemplate";
      parentLink: ParentLink | null;
      collectionId: number;
      /** the draft scaffolds when this template's document arrives */
      templateId: number;
    }
  | {
      status: "editingNewAsset";
      parentLink: ParentLink | null;
      /** the whole document: a draft has no server copy for the cache to own */
      localAsset: T.UnsavedAsset;
      /** the migration in flight, if any, so only its result may land */
      pendingTemplateId: number | null;
    }
  | {
      status: "editingExistingAsset";
      parentLink: ParentLink | null;
      /** names the baseline: the cache slot this session reads documents from */
      assetId: string;
      /**
       * Only the fields the user has changed since the baseline. Everything
       * else reads through, so a refreshed baseline shows through untouched
       * fields for free.
       */
      edits: Partial<T.Asset>;
      /** the migration in flight, if any, so only its result may land */
      pendingTemplateId: number | null;
    }
  | { status: "loadFailed"; parentLink: ParentLink | null; error: Error };

export interface EditorModel {
  sessions: Record<SessionKey, EditSession>;
  /** the session the page itself is editing. Inline children are the others. */
  rootSessionKey: SessionKey | null;
}

export const initialEditorModel: EditorModel = {
  sessions: {},
  rootSessionKey: null,
};

/** The two statuses in which a session holds an asset the user can edit. */
export type EditingSession = Extract<
  EditSession,
  { status: "editingNewAsset" | "editingExistingAsset" }
>;

export function isEditingSession(
  session: EditSession
): session is EditingSession {
  return (
    session.status === "editingNewAsset" ||
    session.status === "editingExistingAsset"
  );
}

export function selectSession(
  model: EditorModel,
  sessionKey: SessionKey | null
): EditSession | null {
  if (sessionKey === null) return null;
  return model.sessions[sessionKey] ?? null;
}

/**
 * The asset baseline a session needs, named by id. The document itself
 * lives in the query cache under this id.
 */
export function selectAssetId(
  model: EditorModel,
  sessionKey: SessionKey | null
): string | null {
  const session = selectSession(model, sessionKey);
  return session?.status === "editingExistingAsset" ? session.assetId : null;
}

/**
 * The asset as the user sees it: the baseline with pending edits laid over
 * it, or the draft itself. Null while the session holds no asset, and null
 * until the baseline for the right asset has arrived: a baseline still
 * showing some other asset must not leak under this session's edits.
 */
export function selectLocalAsset(
  model: EditorModel,
  sessionKey: SessionKey | null,
  baseline: T.Asset | null
): T.Asset | T.UnsavedAsset | null {
  const session = selectSession(model, sessionKey);
  if (!session) return null;
  switch (session.status) {
    case "editingNewAsset":
      return session.localAsset;
    case "editingExistingAsset":
      if (!baseline || baseline.assetId !== session.assetId) return null;
      return { ...baseline, ...session.edits };
    default:
      return null;
  }
}

/** The error that left a session with nothing to edit. */
export function selectLoadError(
  model: EditorModel,
  sessionKey: SessionKey | null
): Error | null {
  const session = selectSession(model, sessionKey);
  return session?.status === "loadFailed" ? session.error : null;
}

/**
 * The template a session needs, named by id. The document itself lives in
 * the query cache under this id. For an existing asset the answer comes
 * from the baseline document, except while a migration is unsaved, where
 * the migrated id in `edits` wins.
 */
export function selectTemplateId(
  model: EditorModel,
  sessionKey: SessionKey | null,
  baseline: T.Asset | null
): number | null {
  const session = selectSession(model, sessionKey);
  if (!session) return null;
  switch (session.status) {
    case "awaitingTemplate":
      return session.templateId;
    case "editingNewAsset":
      return session.localAsset.templateId ?? null;
    case "editingExistingAsset": {
      if (typeof session.edits.templateId === "number") {
        return session.edits.templateId;
      }
      if (!baseline || baseline.assetId !== session.assetId) return null;
      return baseline.templateId ?? null;
    }
    default:
      return null;
  }
}

/**
 * Whether one session holds work a save would send and leaving would lose.
 * Children are not consulted here: walk them with
 * selectSessionAndDescendantKeys and ask per session.
 *
 * Takes the documents because dirtiness is measured in the shape the server
 * would store. While either document is missing there is no measure, so the
 * session reads as clean.
 */
export function selectHasUnsavedEdits(
  model: EditorModel,
  sessionKey: SessionKey | null,
  baseline: T.Asset | null,
  template: T.Template | null
): boolean {
  const session = selectSession(model, sessionKey);
  if (!session || !isEditingSession(session) || !template) return false;
  switch (session.status) {
    case "editingNewAsset":
      // an untouched draft is not unsaved work, or the leave guard would
      // nag on a create page the user never typed into
      return wouldSaveChangeStoredAsset({
        draft: session.localAsset,
        savedAsset: makeNewLocalAsset({
          template,
          collectionId: session.localAsset.collectionId,
        }),
        template,
      });
    case "editingExistingAsset": {
      const onScreen = selectLocalAsset(model, sessionKey, baseline);
      if (!onScreen || !baseline) return false;
      // `edits` may hold differences the server would never store, like a
      // freshly added blank item, so dirtiness is measured against what a
      // save would actually change
      return wouldSaveChangeStoredAsset({
        draft: onScreen,
        savedAsset: baseline,
        template,
      });
    }
    default:
      return assertNever(session);
  }
}

/**
 * The session and everything mounted under it, following parentLink edges.
 * The visited set terminates cycles: asset A relating to B relating back to
 * A can both be open at once.
 */
export function selectSessionAndDescendantKeys(
  model: EditorModel,
  sessionKey: SessionKey
): SessionKey[] {
  const visited = new Set<SessionKey>();
  const queue: SessionKey[] = [sessionKey];
  while (queue.length > 0) {
    const key = queue.shift() as SessionKey;
    if (visited.has(key) || !model.sessions[key]) continue;
    visited.add(key);
    Object.entries(model.sessions).forEach(([childKey, child]) => {
      if (child.parentLink?.sessionKey === key) queue.push(childKey);
    });
  }
  return [...visited];
}

/**
 * An effect the reducer asks the shell to run. Commands are data so the
 * decision to act stays in the reducer, where late resolutions are already
 * dropped: a command that is never emitted can never fire against a session
 * that has closed.
 */
export type EditorCommand =
  | {
      /** The server assigned this session's draft its id. */
      type: "notifyAssetCreated";
      sessionKey: SessionKey;
      assetId: string;
    }
  | {
      /**
       * A create response arrived for a session that no longer holds its
       * draft. The asset exists with nothing pointing at it, which the
       * user must hear.
       */
      type: "notifyCreateDropped";
      sessionKey: SessionKey;
      assetId: string;
    }
  | {
      /** This session's document must be saved, no file may be orphaned. */
      type: "requestSave";
      sessionKey: SessionKey;
    };

/** One reducer step: the next model plus the effects it asks for. */
export interface EditorStep {
  model: EditorModel;
  /** Run by the shell after the model is committed. Most events need none. */
  commands?: EditorCommand[];
}

/** Everything that can change the model. Every event names its session. */
export type EditorEvent =
  | {
      type: "widgetContentsEdited";
      sessionKey: SessionKey;
      fieldTitle: T.WidgetDef["fieldTitle"];
      contents: T.WidgetContent[];
    }
  | {
      /**
       * An upload finished and its item entered the document. Distinct from
       * widgetContentsEdited because its arm also asks for a save: the file
       * exists server-side from the moment the upload started, so a saved
       * asset must reference it before the user can navigate away.
       */
      type: "uploadCompleted";
      sessionKey: SessionKey;
      fieldTitle: T.WidgetDef["fieldTitle"];
      contents: T.WidgetContent[];
    }
  | { type: "collectionChanged"; sessionKey: SessionKey; collectionId: number }
  | {
      type: "readyForDisplayChanged";
      sessionKey: SessionKey;
      readyForDisplay: boolean;
    }
  | {
      type: "availableAfterChanged";
      sessionKey: SessionKey;
      availableAfter: T.PHPDateTime | null;
    }
  | {
      /** opens a session (the root when parentLink is null, replacing the old root) */
      type: "newAssetRequested";
      sessionKey: SessionKey;
      parentLink: ParentLink | null;
      collectionId: number;
      templateId: number;
    }
  | {
      /** opens a session (the root when parentLink is null, replacing the old root) */
      type: "existingAssetRequested";
      sessionKey: SessionKey;
      parentLink: ParentLink | null;
      assetId: string;
    }
  | { type: "sessionClosed"; sessionKey: SessionKey }
  | {
      /**
       * The document an awaitingTemplate session asked for arrived. It
       * carries its templateId back, so a document for a template the
       * user has moved past cannot scaffold the newer request's draft.
       */
      type: "templateDocumentLoaded";
      sessionKey: SessionKey;
      templateId: number;
      template: T.Template;
    }
  | {
      type: "templateDocumentLoadFailed";
      sessionKey: SessionKey;
      templateId: number;
      error: Error;
    }
  | { type: "assetLoadFailed"; sessionKey: SessionKey; error: Error }
  | {
      type: "templateMigrationRequested";
      sessionKey: SessionKey;
      templateId: number;
    }
  | {
      type: "templateMigrated";
      sessionKey: SessionKey;
      templateId: number;
      /** input for scaffolding and diffing, never stored */
      template: T.Template;
      /** the session's current baseline, null for drafts. Input for the diff. */
      baseline: T.Asset | null;
    }
  | {
      type: "templateMigrationFailed";
      sessionKey: SessionKey;
      templateId: number;
      error: Error;
    }
  | {
      /**
       * The create response returned an objectId, before the read-back of
       * the stored document. `baseline` is the draft as it was sent,
       * stamped with the new id and scaffolded: the closest thing to
       * server truth until the read-back replaces it. When the session
       * hangs under a parent, the same transition stamps the new id onto
       * the parent's related-asset item.
       */
      type: "assetCreated";
      sessionKey: SessionKey;
      baseline: T.Asset;
      /** input for the diff, never stored */
      template: T.Template;
    }
  | {
      /**
       * The server accepted an update save. The document read-back arrives
       * separately as baselineRefreshed; this event only retires client-only
       * state the save has now delivered.
       */
      type: "saveAccepted";
      sessionKey: SessionKey;
      template: T.Template;
    }
  | {
      /**
       * The session's baseline in the cache changed: a save's read-back, an
       * inline child save's invalidation, a future freshness refetch. All
       * arrive through this one door and get the same rebase treatment.
       */
      type: "baselineRefreshed";
      sessionKey: SessionKey;
      /** the new baseline in editor shape. Input for the rebase, never stored. */
      baseline: T.Asset;
      template: T.Template;
    }
  | { type: "resetRequested" };

/**
 * The editor's only state transition function.
 *
 * Events for a session that has closed are dropped: work that finishes
 * after its session is gone must not touch whatever opened since.
 *
 * Not referentially transparent: arms that build drafts mint widget content
 * uuids via crypto.randomUUID(). Session keys are minted by the shell.
 */
export function editorReducer(
  model: EditorModel,
  event: EditorEvent
): EditorStep {
  switch (event.type) {
    case "newAssetRequested":
      return {
        model: modelWithSessionOpened(model, event.sessionKey, {
          status: "awaitingTemplate",
          parentLink: event.parentLink,
          collectionId: event.collectionId,
          templateId: event.templateId,
        }),
      };
    case "existingAssetRequested":
      // the session holds only the asset's identity, and the view stays
      // empty until that asset's baseline arrives
      return {
        model: modelWithSessionOpened(model, event.sessionKey, {
          status: "editingExistingAsset",
          parentLink: event.parentLink,
          assetId: event.assetId,
          edits: {},
          pendingTemplateId: null,
        }),
      };
    case "sessionClosed": {
      if (!model.sessions[event.sessionKey]) return { model };
      return {
        model: {
          sessions: omit([event.sessionKey], model.sessions),
          rootSessionKey:
            model.rootSessionKey === event.sessionKey
              ? null
              : model.rootSessionKey,
        },
      };
    }
    case "templateDocumentLoaded":
      return { model: onTemplateDocumentLoaded(model, event) };
    case "templateDocumentLoadFailed":
      return { model: onTemplateDocumentLoadFailed(model, event) };
    case "assetLoadFailed": {
      const session = model.sessions[event.sessionKey];
      if (!session || session.status !== "editingExistingAsset") {
        return { model };
      }
      return {
        model: modelWithSession(model, event.sessionKey, {
          status: "loadFailed",
          parentLink: session.parentLink,
          error: event.error,
        }),
      };
    }
    case "templateMigrationRequested": {
      const session = model.sessions[event.sessionKey];
      if (!session || !isEditingSession(session)) return { model };
      return {
        model: modelWithSession(model, event.sessionKey, {
          ...session,
          pendingTemplateId: event.templateId,
        }),
      };
    }
    case "templateMigrated":
      return { model: onTemplateMigrated(model, event) };
    case "templateMigrationFailed": {
      // the session keeps its current template and the asset stays editable:
      // a failed swap must not cost the user work in progress
      const session = model.sessions[event.sessionKey];
      if (!session || !isEditingSession(session)) return { model };
      if (event.templateId !== session.pendingTemplateId) return { model };
      return {
        model: modelWithSession(model, event.sessionKey, {
          ...session,
          pendingTemplateId: null,
        }),
      };
    }
    case "widgetContentsEdited":
      return {
        model: modelWithFieldEdit(
          model,
          event.sessionKey,
          event.fieldTitle,
          event.contents
        ),
      };
    case "uploadCompleted": {
      // an appended upload item is followed by a save request, always, or
      // the uploaded file would be orphaned server-side
      const next = modelWithFieldEdit(
        model,
        event.sessionKey,
        event.fieldTitle,
        event.contents
      );
      if (next === model) return { model };
      return {
        model: next,
        commands: [{ type: "requestSave", sessionKey: event.sessionKey }],
      };
    }
    case "collectionChanged":
      return {
        model: modelWithFieldEdit(
          model,
          event.sessionKey,
          "collectionId",
          event.collectionId
        ),
      };
    case "readyForDisplayChanged":
      return {
        model: modelWithFieldEdit(
          model,
          event.sessionKey,
          "readyForDisplay",
          event.readyForDisplay
        ),
      };
    case "availableAfterChanged":
      return {
        model: modelWithFieldEdit(
          model,
          event.sessionKey,
          "availableAfter",
          event.availableAfter
        ),
      };
    case "assetCreated":
      return onAssetCreated(model, event);
    case "saveAccepted": {
      const session = model.sessions[event.sessionKey];
      if (!session || session.status !== "editingExistingAsset") {
        return { model };
      }
      return {
        model: modelWithSession(model, event.sessionKey, {
          ...session,
          edits: clearUploadRegenerationFlags(session.edits, event.template),
        }),
      };
    }
    case "baselineRefreshed":
      return { model: onBaselineRefreshed(model, event) };
    case "resetRequested":
      return { model: initialEditorModel };
    default:
      return assertNever(event);
  }
}

function modelWithSession(
  model: EditorModel,
  sessionKey: SessionKey,
  session: EditSession
): EditorModel {
  return {
    ...model,
    sessions: { ...model.sessions, [sessionKey]: session },
  };
}

/**
 * Opening a root session retires the previous root: the page reuses one
 * editor across route changes, so nothing unmounts to close the old root.
 * The old root's inline children close themselves as their widgets unmount.
 */
function modelWithSessionOpened(
  model: EditorModel,
  sessionKey: SessionKey,
  session: EditSession
): EditorModel {
  if (session.parentLink !== null) {
    return modelWithSession(model, sessionKey, session);
  }
  const sessionsWithoutOldRoot =
    model.rootSessionKey === null
      ? model.sessions
      : omit([model.rootSessionKey], model.sessions);
  return {
    sessions: { ...sessionsWithoutOldRoot, [sessionKey]: session },
    rootSessionKey: sessionKey,
  };
}

function onTemplateDocumentLoaded(
  model: EditorModel,
  event: { sessionKey: SessionKey; templateId: number; template: T.Template }
): EditorModel {
  const session = model.sessions[event.sessionKey];
  if (!session || session.status !== "awaitingTemplate") return model;
  if (event.templateId !== session.templateId) return model;
  return modelWithSession(model, event.sessionKey, {
    status: "editingNewAsset",
    parentLink: session.parentLink,
    localAsset: makeNewLocalAsset({
      template: event.template,
      collectionId: session.collectionId,
    }),
    pendingTemplateId: null,
  });
}

function onTemplateDocumentLoadFailed(
  model: EditorModel,
  event: { sessionKey: SessionKey; templateId: number; error: Error }
): EditorModel {
  const session = model.sessions[event.sessionKey];
  if (!session || session.status !== "awaitingTemplate") return model;
  if (event.templateId !== session.templateId) return model;
  return modelWithSession(model, event.sessionKey, {
    status: "loadFailed",
    parentLink: session.parentLink,
    error: event.error,
  });
}

function onTemplateMigrated(
  model: EditorModel,
  event: {
    sessionKey: SessionKey;
    templateId: number;
    template: T.Template;
    baseline: T.Asset | null;
  }
): EditorModel {
  const session = model.sessions[event.sessionKey];
  if (!session || !isEditingSession(session)) return model;
  if (event.templateId !== session.pendingTemplateId) return model;
  switch (session.status) {
    case "editingNewAsset":
      return modelWithSession(model, event.sessionKey, {
        ...session,
        localAsset: migrateAssetToTemplate(session.localAsset, event.template),
        pendingTemplateId: null,
      });
    case "editingExistingAsset": {
      const onScreen = selectLocalAsset(
        model,
        event.sessionKey,
        event.baseline
      );
      if (!onScreen || !event.baseline) return model;
      // the migrated asset differs from the baseline by its new templateId
      // and the fields the new template scaffolds, all of which a save must
      // send
      const migrated = migrateAssetToTemplate(
        onScreen as T.Asset,
        event.template
      );
      return modelWithSession(model, event.sessionKey, {
        ...session,
        edits: diffEditableFields({
          draft: migrated,
          savedAsset: event.baseline,
          template: event.template,
        }),
        pendingTemplateId: null,
      });
    }
    default:
      return assertNever(session);
  }
}

/** Write one field, whichever way the session's status stores changes. */
function modelWithFieldEdit(
  model: EditorModel,
  sessionKey: SessionKey,
  assetKey: string,
  value: unknown
): EditorModel {
  const session = model.sessions[sessionKey];
  if (!session || !isEditingSession(session)) return model;
  switch (session.status) {
    case "editingNewAsset":
      return modelWithSession(model, sessionKey, {
        ...session,
        localAsset: { ...session.localAsset, [assetKey]: value },
      });
    case "editingExistingAsset":
      // an edit equal to the baseline is not dropped here: the reducer holds
      // no baseline to compare against. Dirtiness compares in stored shape
      // anyway, and the next baselineRefreshed prunes redundant edits.
      return modelWithSession(model, sessionKey, {
        ...session,
        edits: { ...session.edits, [assetKey]: value },
      });
    default:
      return assertNever(session);
  }
}

function onAssetCreated(
  model: EditorModel,
  event: { sessionKey: SessionKey; baseline: T.Asset; template: T.Template }
): EditorStep {
  const session = model.sessions[event.sessionKey];
  // a response for a closed session is dropped: the next draft opened under
  // a fresh key, which this response does not carry. The asset still exists
  // server-side with nothing pointing at it, so the drop is announced.
  if (!session || session.status !== "editingNewAsset") {
    return {
      model,
      commands: [
        {
          type: "notifyCreateDropped",
          sessionKey: event.sessionKey,
          assetId: event.baseline.assetId,
        },
      ],
    };
  }

  // the echoed baseline was flag-cleared before dispatch, so the draft loses
  // its flags the same way or they would read as edits made after the send
  const latestLocalAsset = clearUploadRegenerationFlags(
    session.localAsset,
    event.template
  );

  let next = modelWithSession(model, event.sessionKey, {
    status: "editingExistingAsset",
    parentLink: session.parentLink,
    assetId: event.baseline.assetId,
    // anything typed while the create was in flight differs from the echo
    // and stays pending for the next save
    edits: diffEditableFields({
      draft: latestLocalAsset,
      savedAsset: event.baseline,
      template: event.template,
    }),
    pendingTemplateId: null,
  });

  if (session.parentLink) {
    next = modelWithChildAssetIdAdopted(
      next,
      session.parentLink,
      event.baseline.assetId
    );
  }

  return {
    model: next,
    commands: [
      {
        type: "notifyAssetCreated",
        sessionKey: event.sessionKey,
        assetId: event.baseline.assetId,
      },
    ],
  };
}

/**
 * Stamp a child's newly created assetId onto the parent's related-asset
 * item. The unlinked item can only live in unsaved state, never in the
 * parent's baseline, because the server drops related items whose
 * targetAssetId is empty.
 */
function modelWithChildAssetIdAdopted(
  model: EditorModel,
  parentLink: ParentLink,
  assetId: string
): EditorModel {
  const parent = model.sessions[parentLink.sessionKey];
  if (!parent || !isEditingSession(parent)) return model;

  const holder =
    parent.status === "editingNewAsset" ? parent.localAsset : parent.edits;
  const contents = holder[parentLink.fieldTitle];
  if (!Array.isArray(contents)) return model;
  if (!contents.some(isItemWithUuid(parentLink.itemUuid))) return model;

  const linked = contents.map((item) =>
    isItemWithUuid(parentLink.itemUuid)(item)
      ? { ...item, targetAssetId: assetId }
      : item
  );

  if (parent.status === "editingNewAsset") {
    return modelWithSession(model, parentLink.sessionKey, {
      ...parent,
      localAsset: { ...parent.localAsset, [parentLink.fieldTitle]: linked },
    });
  }
  return modelWithSession(model, parentLink.sessionKey, {
    ...parent,
    edits: { ...parent.edits, [parentLink.fieldTitle]: linked },
  });
}

function isItemWithUuid(itemUuid: string): (item: unknown) => boolean {
  return (item) =>
    typeof item === "object" &&
    item !== null &&
    (item as { uuid?: unknown }).uuid === itemUuid;
}

/**
 * The rebase: take the refreshed baseline, keep every edit that still
 * differs from it, and drop the ones it made redundant. Untouched fields
 * follow the new baseline by construction, because they were never in
 * `edits` to begin with.
 */
function onBaselineRefreshed(
  model: EditorModel,
  event: { sessionKey: SessionKey; baseline: T.Asset; template: T.Template }
): EditorModel {
  const session = model.sessions[event.sessionKey];
  if (!session || session.status !== "editingExistingAsset") return model;
  if (event.baseline.assetId !== session.assetId) return model;
  return modelWithSession(model, event.sessionKey, {
    ...session,
    edits: diffEditableFields({
      draft: { ...event.baseline, ...session.edits },
      savedAsset: event.baseline,
      template: event.template,
    }),
  });
}

function assertNever(value: never): never {
  throw new Error(`Unhandled case in the editor: ${JSON.stringify(value)}`);
}
