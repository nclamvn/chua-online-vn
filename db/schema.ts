import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const presence=sqliteTable('presence',{
 id:text('id').primaryKey(),tokenHash:text('token_hash').notNull(),room:text('room').notNull(),name:text('name').notNull(),appearance:text('appearance').notNull().default('{}'),greetings:text('greetings'),
 x:real('x').notNull(),z:real('z').notNull(),yaw:real('yaw').notNull().default(0),pose:text('pose').notNull().default('idle'),seat:text('seat'),
 seq:integer('seq').notNull().default(0),updatedAt:integer('updated_at').notNull(),joinedAt:integer('joined_at').notNull()
},t=>[index('presence_room_time').on(t.room,t.updatedAt),index('presence_expiry').on(t.updatedAt),uniqueIndex('presence_room_seat').on(t.room,t.seat)]);
export const offeringReceipts=sqliteTable('offering_receipts',{
 id:text('id').primaryKey(),ownerHash:text('owner_hash').notNull(),requestId:text('request_id').notNull().unique(),room:text('room').notNull(),kind:text('kind').notNull(),day:text('day').notNull(),slot:integer('slot').notNull(),status:text('status').notNull().default('saved_demo'),createdAt:integer('created_at').notNull(),updatedAt:integer('updated_at').notNull()
},t=>[index('offering_owner_time').on(t.ownerHash,t.createdAt),index('offering_schedule').on(t.day,t.slot,t.status)]);
