import { describe, it, expect } from "vitest";
import { makePlanForSavingRule } from "./makePlanForSavingRule";
import type { PermissionRuleRow } from "./buildRuleRows";
import type { CollectionGrant, InstanceGrant } from "@/types";

// Group 3 holds grant 11 on collection 5 and grant 90 across the
// whole instance. Collection 7 is free for group 3.
const collectionGrants: CollectionGrant[] = [
  { id: 11, collectionId: 5, groupId: 3, permissionLevelId: 10 },
  { id: 42, collectionId: 9, groupId: 3, permissionLevelId: 30 },
];
const instanceGrants: InstanceGrant[] = [
  { id: 90, groupId: 3, permissionLevelId: 30 },
];
const grants = { instanceGrants, collectionGrants };

// The rule row backed by collection grant 11.
const editedRule: PermissionRuleRow = {
  key: "collection-11",
  scope: "collection",
  grantId: 11,
  collectionId: 5,
  collectionLabel: "Herbarium",
  groupId: 3,
  groupLabel: "Curators",
  permissionLevelId: 10,
  permissionLevelNumber: 10,
  permissionLabel: "Viewer",
};

describe("makePlanForSavingRule", () => {
  it("creates when the pair is free", () => {
    const after = { collectionId: 7, groupId: 3, permissionLevelId: 20 };
    const plan = makePlanForSavingRule({ before: null, after, ...grants });
    expect(plan).toEqual({
      steps: [{ action: "create", rule: after }],
      overwrites: null,
    });
  });

  it("overwrites the occupying grant when creating onto an occupied pair", () => {
    const after = { collectionId: 9, groupId: 3, permissionLevelId: 20 };
    const plan = makePlanForSavingRule({ before: null, after, ...grants });
    expect(plan).toEqual({
      steps: [{ action: "update", grantId: 42, rule: after }],
      overwrites: collectionGrants[1],
    });
  });

  it("finds the occupying grant among instance grants for an All Collections rule", () => {
    const after = { collectionId: null, groupId: 3, permissionLevelId: 20 };
    const plan = makePlanForSavingRule({ before: null, after, ...grants });
    expect(plan).toEqual({
      steps: [{ action: "update", grantId: 90, rule: after }],
      overwrites: instanceGrants[0],
    });
  });

  it("updates in place when editing without changing the pair", () => {
    const after = { collectionId: 5, groupId: 3, permissionLevelId: 20 };
    const plan = makePlanForSavingRule({
      before: editedRule,
      after,
      ...grants,
    });
    // grant 11 occupies the pair, but it is the rule being edited, so
    // this is a plain update, not an overwrite
    expect(plan).toEqual({
      steps: [{ action: "update", grantId: 11, rule: after }],
      overwrites: null,
    });
  });

  it("creates then deletes when moving to a free pair", () => {
    const after = { collectionId: 7, groupId: 3, permissionLevelId: 20 };
    const plan = makePlanForSavingRule({
      before: editedRule,
      after,
      ...grants,
    });
    expect(plan).toEqual({
      steps: [
        { action: "create", rule: after },
        { action: "delete", grant: { scope: "collection", grantId: 11 } },
      ],
      overwrites: null,
    });
  });

  it("overwrites then deletes when moving onto an occupied pair", () => {
    const after = { collectionId: 9, groupId: 3, permissionLevelId: 20 };
    const plan = makePlanForSavingRule({
      before: editedRule,
      after,
      ...grants,
    });
    expect(plan).toEqual({
      steps: [
        { action: "update", grantId: 42, rule: after },
        { action: "delete", grant: { scope: "collection", grantId: 11 } },
      ],
      overwrites: collectionGrants[1],
    });
  });

  it("does not exclude a same-id grant from the other scope", () => {
    // Grant ids repeat across scopes: instance grant 11 is a different
    // grant than the collection grant 11 being edited.
    const after = { collectionId: null, groupId: 3, permissionLevelId: 20 };
    const withCollidingId = {
      instanceGrants: [{ id: 11, groupId: 3, permissionLevelId: 30 }],
      collectionGrants,
    };
    const plan = makePlanForSavingRule({
      before: editedRule,
      after,
      ...withCollidingId,
    });
    expect(plan.overwrites).toEqual(withCollidingId.instanceGrants[0]);
    expect(plan.steps).toEqual([
      { action: "update", grantId: 11, rule: after },
      { action: "delete", grant: { scope: "collection", grantId: 11 } },
    ]);
  });
});
