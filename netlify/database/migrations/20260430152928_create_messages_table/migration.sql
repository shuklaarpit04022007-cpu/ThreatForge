CREATE TABLE "messages" (
	"id" serial PRIMARY KEY,
	"message" text NOT NULL,
	"verdict" text NOT NULL,
	"score" integer NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"ip" text,
	"country" text,
	"city" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
