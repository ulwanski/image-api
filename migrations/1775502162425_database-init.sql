CREATE TABLE public.images (
    id bigserial NOT NULL,
    path character varying(255) NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255),
    width integer NOT NULL,
    height integer NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS public.images OWNER to images;

CREATE INDEX ON public.images USING btree (path) WITH (deduplicate_items=True);
CREATE INDEX ON public.images USING btree (title text_pattern_ops) WITH (deduplicate_items=True);
CREATE INDEX ON public.images USING btree (created_at) WITH (deduplicate_items=True);