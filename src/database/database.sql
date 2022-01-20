-- public.communities definition

-- Drop table

-- DROP TABLE public.communities;

CREATE TABLE public.communities (
	community_id int4 NOT NULL GENERATED ALWAYS AS IDENTITY,
	name varchar(32) NULL,
	title varchar(64) NULL,
	description varchar(255) NULL,
	created_at timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT communities_pkey PRIMARY KEY (community_id)
);


-- public.users definition

-- Drop table

-- DROP TABLE public.users;

CREATE TABLE public.users (
	user_id int4 NOT NULL GENERATED ALWAYS AS IDENTITY,
	email varchar(255) NULL,
	username varchar(32) NULL,
	"password" varchar(255) NULL,
	created_at timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT users_email_key UNIQUE (email),
	CONSTRAINT users_pkey PRIMARY KEY (user_id),
	CONSTRAINT users_username_key UNIQUE (username)
);


-- public.follows definition

-- Drop table

-- DROP TABLE public.follows;

CREATE TABLE public.follows (
	follower_id int4 NOT NULL,
	followed_id int4 NOT NULL,
	followed_at timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT follows_check CHECK ((followed_id <> follower_id)),
	CONSTRAINT follows_pkey PRIMARY KEY (follower_id, followed_id),
	CONSTRAINT follows_follower_id_fkey FOREIGN KEY (followed_id) REFERENCES public.users(user_id) ON DELETE CASCADE,
	CONSTRAINT follows_user_id_fkey FOREIGN KEY (follower_id) REFERENCES public.users(user_id) ON DELETE CASCADE
);


-- public.members definition

-- Drop table

-- DROP TABLE public.members;

CREATE TABLE public.members (
	community_id int4 NOT NULL,
	user_id int4 NOT NULL,
	joined_at timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT members_pkey PRIMARY KEY (community_id, user_id),
	CONSTRAINT members_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(community_id) ON DELETE CASCADE,
	CONSTRAINT members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE
);


-- public.posts definition

-- Drop table

-- DROP TABLE public.posts;

CREATE TABLE public.posts (
	post_id int4 NOT NULL GENERATED ALWAYS AS IDENTITY,
	title varchar(128) NULL,
	description varchar(255) NULL,
	created_at timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	user_id int4 NOT NULL,
	community_id int4 NOT NULL,
	CONSTRAINT posts_pkey PRIMARY KEY (post_id),
	CONSTRAINT posts_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(community_id) ON DELETE CASCADE,
	CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE
);


-- public.saved_posts definition

-- Drop table

-- DROP TABLE public.saved_posts;

CREATE TABLE public.saved_posts (
	user_id int4 NOT NULL,
	post_id int4 NOT NULL,
	saved_at timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT saved_posts_pkey PRIMARY KEY (user_id, post_id),
	CONSTRAINT saved_posts_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(post_id) ON DELETE CASCADE,
	CONSTRAINT saved_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE
);


-- public."comments" definition

-- Drop table

-- DROP TABLE public."comments";

CREATE TABLE public."comments" (
	comment_id int4 NOT NULL GENERATED ALWAYS AS IDENTITY,
	post_id int4 NOT NULL,
	user_id int4 NOT NULL,
	parent_comment_id int4 NULL,
	message varchar(255) NULL,
	created_at timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT comments_pkey PRIMARY KEY (comment_id),
	CONSTRAINT comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public."comments"(comment_id) ON DELETE CASCADE,
	CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(post_id) ON DELETE CASCADE,
	CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE
);


-- public.reaction definition

-- Drop type

-- DROP TYPE public.reaction;

CREATE TYPE public.reaction AS ENUM (
	'like',
	'dislike'
);


-- public.post_reactions definition

-- Drop table

-- DROP TABLE public.post_reactions;

CREATE TABLE public.post_reactions (
	post_id int4 NOT NULL,
	user_id int4 NOT NULL,
	reaction reaction NULL,
	CONSTRAINT post_reactions_pkey PRIMARY KEY (post_id, user_id),
	CONSTRAINT post_reactions_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(post_id) ON DELETE CASCADE,
	CONSTRAINT post_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE
);


-- public.comment_reactions definition

-- Drop table

-- DROP TABLE public.comment_reactions;

CREATE TABLE public.comment_reactions (
	comment_id int4 NOT NULL,
	user_id int4 NOT NULL,
	reaction reaction NULL,
	CONSTRAINT comment_reactions_pkey PRIMARY KEY (comment_id, user_id),
	CONSTRAINT comment_reactions_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public."comments"(comment_id) ON DELETE CASCADE,
	CONSTRAINT comment_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE
);


-- public.messages definition

-- Drop table

-- DROP TABLE public.messages;

CREATE TABLE public.messages (
	message_id int4 NOT NULL GENERATED ALWAYS AS IDENTITY,
	sender_id int4 NOT NULL,
	recipient_id int4 NOT NULL,
	message varchar(255) NULL,
	sent_at timestamptz NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT messages_pkey PRIMARY KEY (message_id),
	CONSTRAINT messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(user_id) ON DELETE CASCADE,
	CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(user_id) ON DELETE CASCADE
);
