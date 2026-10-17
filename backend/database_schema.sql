--
-- PostgreSQL database dump
--

\restrict NmouDeMxIqaL5XxmJcHD1jftCkb7mlkp5e5uXyqF1lGn4T3RvM9eQ9juuwPkeEu

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP INDEX IF EXISTS public.idx_employees_name;
DROP INDEX IF EXISTS public.idx_employees_dept;
DROP INDEX IF EXISTS public.idx_asset_history_asset_id;
DROP INDEX IF EXISTS public.idx_asset_history_asset_code;
DROP INDEX IF EXISTS public.idx_asset_history_action_type;
DROP INDEX IF EXISTS public.idx_asset_history_action_date;
ALTER TABLE IF EXISTS ONLY public.employees DROP CONSTRAINT IF EXISTS employees_pkey;
ALTER TABLE IF EXISTS ONLY public.employees DROP CONSTRAINT IF EXISTS employees_email_key;
ALTER TABLE IF EXISTS ONLY public.assets DROP CONSTRAINT IF EXISTS assets_pkey;
ALTER TABLE IF EXISTS ONLY public.assets DROP CONSTRAINT IF EXISTS assets_asset_code_key;
ALTER TABLE IF EXISTS ONLY public.asset_history DROP CONSTRAINT IF EXISTS asset_history_pkey;
ALTER TABLE IF EXISTS public.employees ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.assets ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.asset_history ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.employees_id_seq;
DROP TABLE IF EXISTS public.employees;
DROP SEQUENCE IF EXISTS public.assets_id_seq;
DROP TABLE IF EXISTS public.assets;
DROP SEQUENCE IF EXISTS public.asset_history_id_seq;
DROP TABLE IF EXISTS public.asset_history;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: asset_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asset_history (
    id integer NOT NULL,
    asset_id integer NOT NULL,
    asset_code character varying(100) NOT NULL,
    action_type character varying(50) NOT NULL,
    employee character varying(100),
    action_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    notes text,
    asset_name character varying(100) DEFAULT ''::character varying
);


--
-- Name: asset_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.asset_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: asset_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.asset_history_id_seq OWNED BY public.asset_history.id;


--
-- Name: assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assets (
    id integer NOT NULL,
    asset_name character varying(100) NOT NULL,
    asset_code character varying(50) NOT NULL,
    category character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'Available'::character varying,
    assigned_to character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    serial_number character varying(100) DEFAULT ''::character varying,
    purchase_date character varying(50) DEFAULT ''::character varying,
    location character varying(100) DEFAULT ''::character varying
);


--
-- Name: assets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.assets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: assets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.assets_id_seq OWNED BY public.assets.id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    department character varying(50),
    role character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: asset_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_history ALTER COLUMN id SET DEFAULT nextval('public.asset_history_id_seq'::regclass);


--
-- Name: assets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets ALTER COLUMN id SET DEFAULT nextval('public.assets_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Data for Name: asset_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.asset_history (id, asset_id, asset_code, action_type, employee, action_date, notes, asset_name) FROM stdin;
1	1	ASSET-001	Created	\N	2026-09-17 11:57:41.808886	Initial asset inventory setup	MacBook Pro 14"
2	1	ASSET-001	Assigned	John Doe	2026-10-02 11:57:41.808886	Standard workstation allocation	MacBook Pro 14"
4	3	ASSET-003	Created	\N	2026-10-17 12:18:22.573502	Asset registered into inventory	Dell Latitude 5540
5	3	ASSET-003	Assigned	Jane Smith	2026-10-17 12:18:22.682341	Q4 Engineering deployment	Dell Latitude 5540
6	3	ASSET-003	Returned	Jane Smith	2026-10-17 12:18:22.711977	Returned after project completion	Dell Latitude 5540
7	4	ASSET-05	Created	\N	2026-10-17 12:39:15.564052	Asset registered into inventory	MacBook
8	4	ASSET-05	Assigned	Michael Brown	2026-10-17 13:54:55.369102	Project Allocation	MacBook
9	3	ASSET-003	Assigned	Jane Smith	2026-10-17 22:19:05.477673	Allocated for Product Management duties	Dell Latitude 5540
10	3	ASSET-003	Returned	Jane Smith	2026-10-17 22:19:24.916038	Returned to available inventory	Dell Latitude 5540
11	3	ASSET-003	Assigned	Sarah Williams	2026-10-17 22:24:08.588662	Assigned to staff member: Sarah Williams	Dell Latitude 5540
12	5	ASSET-06	Created	\N	2026-10-17 22:25:23.550564	Asset registered into inventory	Lenovo H17
15	2	ASSET-002	Maintenance	\N	2026-10-17 23:03:27.420291	Annual display calibration completed	
14	1	ASSET-001	Assigned	Alice Smith	2026-10-17 23:03:27.420291	Assigned MacBook Pro to Alice for onboarding	MacBook Pro 14"
\.


--
-- Data for Name: assets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assets (id, asset_name, asset_code, category, status, assigned_to, created_at, serial_number, purchase_date, location) FROM stdin;
4	MacBook	ASSET-05	Laptop	Assigned	Michael Brown	2026-10-17 12:39:15.556285	LNV-TP-987567	2026-10-17	Main IT Storage Room
3	Dell Latitude 5540	ASSET-003	Laptop	Assigned	Sarah Williams	2026-10-17 12:18:22.569744	DELL-LAT-5540-X1	2024-05-10	Engineering Hub - Room 204
5	Lenovo H17	ASSET-06	Laptop	Under Repair	\N	2026-10-17 22:25:23.540709	LNV-TP-987567	2026-10-17	Main IT Storage Room
1	MacBook Pro 14"	ASSET-001	Laptop	Assigned	John Doe	2026-10-16 14:54:02.685185	MBP14-2024-001	2024-01-15	Floor 3 - Desk 302
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employees (id, name, email, department, role, created_at) FROM stdin;
3	John Doe	john.doe@company.com	Engineering	Senior Developer	2026-10-17 22:12:16.384205
4	Jane Smith	jane.smith@company.com	Product	Product Manager	2026-10-17 22:12:16.384205
5	Alex Johnson	alex.j@company.com	Operations	System Admin	2026-10-17 22:12:16.384205
6	Sarah Williams	sarah.w@company.com	Design	UI/UX Lead	2026-10-17 22:12:16.384205
7	Michael Brown	m.brown@company.com	Finance	Financial Analyst	2026-10-17 22:12:16.384205
12	Alice Smith	alice@company.com	Engineering	Software Developer	2026-10-17 23:03:27.420291
13	Bob Johnson	bob@company.com	Design	UI/UX Designer	2026-10-17 23:03:27.420291
\.


--
-- Name: asset_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.asset_history_id_seq', 15, true);


--
-- Name: assets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.assets_id_seq', 5, true);


--
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.employees_id_seq', 14, true);


--
-- Name: asset_history asset_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_history
    ADD CONSTRAINT asset_history_pkey PRIMARY KEY (id);


--
-- Name: assets assets_asset_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_asset_code_key UNIQUE (asset_code);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: employees employees_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_email_key UNIQUE (email);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: idx_asset_history_action_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asset_history_action_date ON public.asset_history USING btree (action_date DESC);


--
-- Name: idx_asset_history_action_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asset_history_action_type ON public.asset_history USING btree (action_type);


--
-- Name: idx_asset_history_asset_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asset_history_asset_code ON public.asset_history USING btree (asset_code);


--
-- Name: idx_asset_history_asset_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asset_history_asset_id ON public.asset_history USING btree (asset_id);


--
-- Name: idx_employees_dept; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employees_dept ON public.employees USING btree (department);


--
-- Name: idx_employees_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employees_name ON public.employees USING btree (lower((name)::text));


--
-- PostgreSQL database dump complete
--

\unrestrict NmouDeMxIqaL5XxmJcHD1jftCkb7mlkp5e5uXyqF1lGn4T3RvM9eQ9juuwPkeEu

