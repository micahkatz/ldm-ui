import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const dataset = pgTable("dataset", {
  id: serial("id"),
  user_id: text("user_id"),
  prompt: text("prompt"),
  original_dataset_uri: text("original_dataset_uri"),
  augmented_dataset_uri: text("augmented_dataset_uri"),
  column_data: text("column_data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});