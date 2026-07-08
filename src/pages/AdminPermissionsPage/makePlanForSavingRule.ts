import type { CollectionGrant, InstanceGrant } from "@/types";
import type { PermissionRuleRow } from "./buildRuleRows";
import type { GrantIdentifier, RuleInput, RuleSaveStep } from "./ruleQueries";

export type RuleSavePlan = {
  // Ordered so a mid-plan failure leaves at worst an extra rule in
  // the table, never a lost rule or dropped access.
  steps: RuleSaveStep[];
  // Drives the form's replace warning.
  overwrites: InstanceGrant | CollectionGrant | null;
};

/**
 * Decide the API calls that save the submitted rule.
 *
 * A (collection, group) pair holds at most one grant, so saving onto
 * an occupied pair overwrites the grant already there.
 *
 * @param before - The rule the form opened on, null in create mode.
 * @param after - The rule as filled out in the form.
 */
export function makePlanForSavingRule({
  before,
  after,
  instanceGrants,
  collectionGrants,
}: {
  before: PermissionRuleRow | null;
  after: RuleInput;
  instanceGrants: InstanceGrant[];
  collectionGrants: CollectionGrant[];
}): RuleSavePlan {
  const existingGrantAtPair = findGrantAtPair(after, {
    instanceGrants,
    collectionGrants,
    excluding: before,
  });

  if (!before) {
    if (existingGrantAtPair) {
      return {
        steps: [
          { action: "update", grantId: existingGrantAtPair.id, rule: after },
        ],
        overwrites: existingGrantAtPair,
      };
    }
    return {
      steps: [{ action: "create", rule: after }],
      overwrites: null,
    };
  }

  const isSamePair =
    after.collectionId === before.collectionId &&
    after.groupId === before.groupId;
  if (isSamePair) {
    return {
      steps: [{ action: "update", grantId: before.grantId, rule: after }],
      overwrites: null,
    };
  }

  const beforeGrant: GrantIdentifier = {
    scope: before.scope,
    grantId: before.grantId,
  };
  if (existingGrantAtPair) {
    return {
      steps: [
        { action: "update", grantId: existingGrantAtPair.id, rule: after },
        { action: "delete", grant: beforeGrant },
      ],
      overwrites: existingGrantAtPair,
    };
  }
  return {
    steps: [
      { action: "create", rule: after },
      { action: "delete", grant: beforeGrant },
    ],
    overwrites: null,
  };
}

// The grant already at the pair `rule` targets, excluding the rule
// being edited (its own spot is not a conflict).
function findGrantAtPair(
  rule: RuleInput,
  args: {
    instanceGrants: InstanceGrant[];
    collectionGrants: CollectionGrant[];
    excluding: PermissionRuleRow | null;
  }
): InstanceGrant | CollectionGrant | null {
  const { instanceGrants, collectionGrants, excluding } = args;

  const found =
    rule.collectionId === null
      ? instanceGrants.find((grant) => grant.groupId === rule.groupId)
      : collectionGrants.find(
          (grant) =>
            grant.collectionId === rule.collectionId &&
            grant.groupId === rule.groupId
        );
  if (!found) return null;

  const pairScope = rule.collectionId === null ? "instance" : "collection";
  const isTheRuleBeingEdited =
    excluding !== null &&
    excluding.scope === pairScope &&
    excluding.grantId === found.id;
  return isTheRuleBeingEdited ? null : found;
}
