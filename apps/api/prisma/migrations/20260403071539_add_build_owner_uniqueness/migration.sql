/*
  Warnings:

  - A unique constraint covering the columns `[make,model,name]` on the table `Build` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Build_make_model_name_key" ON "Build"("make", "model", "name");
