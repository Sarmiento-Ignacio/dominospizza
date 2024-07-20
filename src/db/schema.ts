import { createId } from "@paralleldrive/cuid2";
import { relations, sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import { customAlphabet } from "nanoid";



const createSessionId = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz_-",
  48
);


export const users = sqliteTable("users", {
  id: text("id")
    .$default(() => createId())
    .primaryKey(),
  fullName: text("full_name"),
  userName: text("user_name").unique(),
  email: text("email").notNull().unique(),
  profilePhoto: text("profile_photo"),
  roleId: text("role_id").references(() => roles.id, { onDelete: "cascade" }),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions),
  loginLogs: many(loginLogs),
  passwords: one(passwords),
  roles: one(roles)
}));


export const sessions = sqliteTable("sessions", {
  id: text("id")
    .$default(() => createSessionId())
    .primaryKey(),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at").notNull(),
});

export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
  loginLog: one(loginLogs),
}));

export const loginLogs = sqliteTable("login_logs", {
  id: text("id")
    .$default(() => createId())
    .primaryKey(),
  sessionId: text("session_id").references(() => sessions.id, {
    onDelete: "set null",
  }),
  userId: text("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),

  browser: text("browser").notNull(),
  device: text("device").notNull(),
  os: text("os").notNull(),
  ip: text("ip").notNull(),
  loggedInAt: text("logged_in_at").default(sql`CURRENT_TIMESTAMP`),
});

export const loginLogsRelations = relations(loginLogs, ({ one }) => ({
  user: one(users, {
    fields: [loginLogs.userId],
    references: [users.id],
  }),
  session: one(sessions, {
    fields: [loginLogs.sessionId],
    references: [sessions.id],
  }),
}));


export const passwords = sqliteTable("passwords", {
  userId: text("user_id").references(() => users.id, {
    onDelete: "cascade",
  })
    .primaryKey(),
  password: text("password").notNull(),
});

export const passwordRelations = relations(passwords, ({ one }) => ({
  user: one(users, {
    fields: [passwords.userId],
    references: [users.id],
  }),
}));

const createCategoriesId = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz_-",
  48
);


export const categories = sqliteTable("categories", {
  id: text("id").$default(() => createCategoriesId()).primaryKey(),
  name: text("name").notNull().unique(),
  createAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),

});

const createProductId = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz_-",
  48
);

export const products = sqliteTable("products", {
  id: text("id").$default(() => createProductId()).primaryKey(),
  productCode: text("product_code").$default(() => createProductId()).notNull().unique(),
  productName: text("product_name").notNull().unique(),
  categoriesId: text("categories_id").references(() => categories.id, { onDelete: "cascade" }),
  details: text("details"),
  status: text("status").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),

});


export const productRelations = relations(products, ({ many, one }) => ({
  categories: one(categories, {
    fields: [products.categoriesId],
    references: [categories.id],
  }),

}));


export const stocks = sqliteTable("stocks", {
  id: text("id").$default(() => createProductId()).primaryKey(),
  stockQuantity: integer("stock_quantity").notNull(),
  currentQuantity: integer("current_quantity").notNull(),
  note: text("note"),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
  productId: text("product_id").references(() => products.id, { onDelete: "cascade" }),
  categoriesId: text("categories_id").references(() => categories.id, { onDelete: "cascade" }),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const stockRelations = relations(stocks, ({ one }) => ({
  product: one(products, {
    fields: [stocks.productId],
    references: [products.id],
  }),
}));

export const roles = sqliteTable("roles", {
  id: text("id").$default(() => createId()).primaryKey(),
  roleName: text("role_name").notNull().unique(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});
