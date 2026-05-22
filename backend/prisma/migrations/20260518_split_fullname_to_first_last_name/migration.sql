-- Split fullname into firstName and lastName for User and Admin tables
-- First name = first word, Last name = remaining words

-- Step 1: Add new columns as nullable
ALTER TABLE "User" ADD COLUMN "firstNameEn" TEXT;
ALTER TABLE "User" ADD COLUMN "lastNameEn" TEXT;
ALTER TABLE "User" ADD COLUMN "firstNameTa" TEXT;
ALTER TABLE "User" ADD COLUMN "lastNameTa" TEXT;

ALTER TABLE "Admin" ADD COLUMN "firstNameEn" TEXT;
ALTER TABLE "Admin" ADD COLUMN "lastNameEn" TEXT;
ALTER TABLE "Admin" ADD COLUMN "firstNameTa" TEXT;
ALTER TABLE "Admin" ADD COLUMN "lastNameTa" TEXT;

-- Step 2: Migrate data from fullname to firstName/lastName
-- For English names: split on first space
UPDATE "User" SET 
  "firstNameEn" = SPLIT_PART("fullnameEn", ' ', 1),
  "lastNameEn" = CASE 
    WHEN POSITION(' ' IN "fullnameEn") > 0 
    THEN SUBSTRING("fullnameEn" FROM POSITION(' ' IN "fullnameEn") + 1)
    ELSE ''
  END,
  "firstNameTa" = SPLIT_PART("fullnameTa", ' ', 1),
  "lastNameTa" = CASE 
    WHEN POSITION(' ' IN "fullnameTa") > 0 
    THEN SUBSTRING("fullnameTa" FROM POSITION(' ' IN "fullnameTa") + 1)
    ELSE ''
  END;

UPDATE "Admin" SET 
  "firstNameEn" = SPLIT_PART("fullnameEn", ' ', 1),
  "lastNameEn" = CASE 
    WHEN POSITION(' ' IN "fullnameEn") > 0 
    THEN SUBSTRING("fullnameEn" FROM POSITION(' ' IN "fullnameEn") + 1)
    ELSE ''
  END,
  "firstNameTa" = SPLIT_PART("fullnameTa", ' ', 1),
  "lastNameTa" = CASE 
    WHEN POSITION(' ' IN "fullnameTa") > 0 
    THEN SUBSTRING("fullnameTa" FROM POSITION(' ' IN "fullnameTa") + 1)
    ELSE ''
  END;

-- Step 3: Make new columns NOT NULL
ALTER TABLE "User" ALTER COLUMN "firstNameEn" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "lastNameEn" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "firstNameTa" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "lastNameTa" SET NOT NULL;

ALTER TABLE "Admin" ALTER COLUMN "firstNameEn" SET NOT NULL;
ALTER TABLE "Admin" ALTER COLUMN "lastNameEn" SET NOT NULL;
ALTER TABLE "Admin" ALTER COLUMN "firstNameTa" SET NOT NULL;
ALTER TABLE "Admin" ALTER COLUMN "lastNameTa" SET NOT NULL;

-- Step 4: Drop old columns
ALTER TABLE "User" DROP COLUMN "fullnameEn";
ALTER TABLE "User" DROP COLUMN "fullnameTa";

ALTER TABLE "Admin" DROP COLUMN "fullnameEn";
ALTER TABLE "Admin" DROP COLUMN "fullnameTa";

-- Step 5: Profile name fields
ALTER TABLE "Profile" ADD COLUMN "firstNameEn" TEXT;
ALTER TABLE "Profile" ADD COLUMN "lastNameEn" TEXT;
ALTER TABLE "Profile" ADD COLUMN "firstNameTa" TEXT;
ALTER TABLE "Profile" ADD COLUMN "lastNameTa" TEXT;

-- Migrate Profile data
UPDATE "Profile" SET 
  "firstNameEn" = SPLIT_PART("nameEn", ' ', 1),
  "lastNameEn" = CASE 
    WHEN POSITION(' ' IN "nameEn") > 0 
    THEN SUBSTRING("nameEn" FROM POSITION(' ' IN "nameEn") + 1)
    ELSE NULL
  END,
  "firstNameTa" = SPLIT_PART("nameTa", ' ', 1),
  "lastNameTa" = CASE 
    WHEN POSITION(' ' IN "nameTa") > 0 
    THEN SUBSTRING("nameTa" FROM POSITION(' ' IN "nameTa") + 1)
    ELSE NULL
  END;

ALTER TABLE "Profile" DROP COLUMN "nameEn";
ALTER TABLE "Profile" DROP COLUMN "nameTa";
