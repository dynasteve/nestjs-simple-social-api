/*
  Warnings:

  - Made the column `username` on table `Users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Users_email_key";

-- AlterTable
ALTER TABLE "Users" ALTER COLUMN "username" SET NOT NULL;
