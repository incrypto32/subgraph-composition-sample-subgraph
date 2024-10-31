import { Entity } from '@graphprotocol/graph-ts';

export class EntityTrigger<T extends Entity> {
  constructor(
    public entityOp: EntityOp,
    public entityType: string,
    public entity: T, // T is a specific type that extends Entity
  ) {}
}

export enum EntityOp {
  Create,
  Modify,
  Remove,
}
