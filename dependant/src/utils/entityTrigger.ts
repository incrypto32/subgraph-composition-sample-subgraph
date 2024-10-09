import { Entity } from '@graphprotocol/graph-ts';

export class EntityTrigger {
  constructor(
    public entityOp: u32,
    public entityType: string,
    public entity: Entity,
  ) {}
}

export enum EntityOp {
  Create,
  Modify,
  Remove,
}
