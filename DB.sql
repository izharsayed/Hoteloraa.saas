--
-- PostgreSQL database dump
--

\restrict Zf7L2NkeHFgZrivFnom84E4p9KZ9xMi5liyAoEHuY9EYyEHxQovBfl9QxdfWxSq

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

-- Started on 2026-06-20 13:30:06

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

--
-- TOC entry 880 (class 1247 OID 40208)
-- Name: BusinessType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."BusinessType" AS ENUM (
    'RESTAURANT',
    'LODGING',
    'HOTEL_RESTAURANT'
);


ALTER TYPE public."BusinessType" OWNER TO postgres;

--
-- TOC entry 916 (class 1247 OID 40358)
-- Name: GuestIdType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."GuestIdType" AS ENUM (
    'PASSPORT',
    'DRIVING_LICENSE',
    'NATIONAL_ID',
    'AADHAAR',
    'OTHER'
);


ALTER TYPE public."GuestIdType" OWNER TO postgres;

--
-- TOC entry 910 (class 1247 OID 40334)
-- Name: HousekeepingStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."HousekeepingStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'INSPECTED'
);


ALTER TYPE public."HousekeepingStatus" OWNER TO postgres;

--
-- TOC entry 919 (class 1247 OID 40370)
-- Name: InventoryUnit; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."InventoryUnit" AS ENUM (
    'KG',
    'GRAM',
    'LITRE',
    'ML',
    'PIECE',
    'PACKET',
    'BOX',
    'DOZEN',
    'BOTTLE'
);


ALTER TYPE public."InventoryUnit" OWNER TO postgres;

--
-- TOC entry 898 (class 1247 OID 40284)
-- Name: KOTStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."KOTStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'READY',
    'CANCELLED'
);


ALTER TYPE public."KOTStatus" OWNER TO postgres;

--
-- TOC entry 895 (class 1247 OID 40268)
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'PREPARING',
    'READY',
    'SERVED',
    'CANCELLED',
    'COMPLETED'
);


ALTER TYPE public."OrderStatus" OWNER TO postgres;

--
-- TOC entry 901 (class 1247 OID 40294)
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'CASH',
    'CARD',
    'UPI',
    'BANK_TRANSFER',
    'WALLET',
    'CREDIT'
);


ALTER TYPE public."PaymentMethod" OWNER TO postgres;

--
-- TOC entry 904 (class 1247 OID 40308)
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'PAID',
    'PARTIAL',
    'REFUNDED',
    'FAILED'
);


ALTER TYPE public."PaymentStatus" OWNER TO postgres;

--
-- TOC entry 922 (class 1247 OID 40390)
-- Name: PurchaseStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PurchaseStatus" AS ENUM (
    'PENDING',
    'RECEIVED',
    'PARTIAL',
    'CANCELLED'
);


ALTER TYPE public."PurchaseStatus" OWNER TO postgres;

--
-- TOC entry 913 (class 1247 OID 40344)
-- Name: ReservationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ReservationStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'CHECKED_IN',
    'CHECKED_OUT',
    'CANCELLED',
    'NO_SHOW'
);


ALTER TYPE public."ReservationStatus" OWNER TO postgres;

--
-- TOC entry 907 (class 1247 OID 40320)
-- Name: RoomStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RoomStatus" AS ENUM (
    'AVAILABLE',
    'OCCUPIED',
    'RESERVED',
    'MAINTENANCE',
    'CHECKOUT_PENDING',
    'CLEANING'
);


ALTER TYPE public."RoomStatus" OWNER TO postgres;

--
-- TOC entry 883 (class 1247 OID 40216)
-- Name: SubscriptionPlan; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SubscriptionPlan" AS ENUM (
    'FREE',
    'STARTER',
    'PROFESSIONAL',
    'ENTERPRISE'
);


ALTER TYPE public."SubscriptionPlan" OWNER TO postgres;

--
-- TOC entry 886 (class 1247 OID 40226)
-- Name: SubscriptionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SubscriptionStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'TRIAL',
    'EXPIRED',
    'CANCELLED'
);


ALTER TYPE public."SubscriptionStatus" OWNER TO postgres;

--
-- TOC entry 892 (class 1247 OID 40258)
-- Name: TableStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TableStatus" AS ENUM (
    'AVAILABLE',
    'OCCUPIED',
    'RESERVED',
    'CLEANING'
);


ALTER TYPE public."TableStatus" OWNER TO postgres;

--
-- TOC entry 889 (class 1247 OID 40238)
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'SUPER_ADMIN',
    'TENANT_ADMIN',
    'MANAGER',
    'RECEPTIONIST',
    'CAPTAIN',
    'CHEF',
    'HOUSEKEEPING',
    'ACCOUNTANT',
    'CASHIER'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 247 (class 1259 OID 41139)
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    action text NOT NULL,
    actor text NOT NULL,
    entity text NOT NULL,
    "previousValue" text,
    "newValue" text,
    severity text DEFAULT 'INFO'::text NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 40505)
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    description text,
    type text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 40656)
-- Name: folio_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.folio_items (
    id text NOT NULL,
    "paymentId" text NOT NULL,
    description text NOT NULL,
    amount double precision NOT NULL,
    type text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.folio_items OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 40706)
-- Name: guests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.guests (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    email text,
    phone text NOT NULL,
    "idType" public."GuestIdType" DEFAULT 'NATIONAL_ID'::public."GuestIdType" NOT NULL,
    "idNumber" text,
    address text,
    city text,
    country text,
    nationality text,
    "dateOfBirth" timestamp(3) without time zone,
    notes text,
    "totalStays" integer DEFAULT 0 NOT NULL,
    "totalSpent" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.guests OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 40760)
-- Name: housekeeping; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.housekeeping (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "roomId" text NOT NULL,
    "assignedTo" text,
    status public."HousekeepingStatus" DEFAULT 'PENDING'::public."HousekeepingStatus" NOT NULL,
    "taskType" text NOT NULL,
    notes text,
    "scheduledAt" timestamp(3) without time zone,
    "startedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.housekeeping OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 40776)
-- Name: inventory_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_items (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    description text,
    sku text,
    unit public."InventoryUnit" DEFAULT 'PIECE'::public."InventoryUnit" NOT NULL,
    quantity double precision DEFAULT 0 NOT NULL,
    "minimumStock" double precision DEFAULT 0 NOT NULL,
    "costPrice" double precision DEFAULT 0 NOT NULL,
    "imageUrl" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.inventory_items OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 40628)
-- Name: kot_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kot_items (
    id text NOT NULL,
    "kotId" text NOT NULL,
    "orderItemId" text NOT NULL,
    quantity integer NOT NULL,
    notes text
);


ALTER TABLE public.kot_items OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 40612)
-- Name: kots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kots (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "orderId" text NOT NULL,
    "userId" text,
    "kotNumber" text NOT NULL,
    status public."KOTStatus" DEFAULT 'PENDING'::public."KOTStatus" NOT NULL,
    notes text,
    "printedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.kots OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 40518)
-- Name: menu_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.menu_categories (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    description text,
    "imageUrl" text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.menu_categories OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 40534)
-- Name: menu_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.menu_items (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "menuCategoryId" text,
    "categoryId" text,
    name text NOT NULL,
    description text,
    price double precision NOT NULL,
    "costPrice" double precision,
    "imageUrl" text,
    "isVeg" boolean DEFAULT true NOT NULL,
    "isAvailable" boolean DEFAULT true NOT NULL,
    "preparationTime" integer,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.menu_items OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 40596)
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "menuItemId" text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "unitPrice" double precision NOT NULL,
    "totalPrice" double precision NOT NULL,
    notes text,
    "isVoid" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 40573)
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "tableId" text,
    "userId" text,
    "reservationId" text,
    "orderNumber" text NOT NULL,
    status public."OrderStatus" DEFAULT 'PENDING'::public."OrderStatus" NOT NULL,
    subtotal double precision DEFAULT 0 NOT NULL,
    "taxAmount" double precision DEFAULT 0 NOT NULL,
    "discountAmount" double precision DEFAULT 0 NOT NULL,
    "totalAmount" double precision DEFAULT 0 NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 40639)
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "orderId" text,
    "reservationId" text,
    "userId" text,
    amount double precision NOT NULL,
    method public."PaymentMethod" DEFAULT 'CASH'::public."PaymentMethod" NOT NULL,
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    reference text,
    notes text,
    "paidAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 40465)
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id text NOT NULL,
    module text NOT NULL,
    action text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 40835)
-- Name: purchase_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_items (
    id text NOT NULL,
    "purchaseId" text NOT NULL,
    "inventoryItemId" text NOT NULL,
    quantity double precision NOT NULL,
    "unitPrice" double precision NOT NULL,
    "totalPrice" double precision NOT NULL
);


ALTER TABLE public.purchase_items OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 40814)
-- Name: purchases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchases (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "vendorId" text,
    "purchaseNumber" text NOT NULL,
    status public."PurchaseStatus" DEFAULT 'PENDING'::public."PurchaseStatus" NOT NULL,
    subtotal double precision DEFAULT 0 NOT NULL,
    "taxAmount" double precision DEFAULT 0 NOT NULL,
    "totalAmount" double precision DEFAULT 0 NOT NULL,
    notes text,
    "receivedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.purchases OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 40848)
-- Name: reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reports (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    type text NOT NULL,
    data jsonb NOT NULL,
    period text,
    "generatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.reports OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 40726)
-- Name: reservations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reservations (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "roomId" text NOT NULL,
    "guestId" text NOT NULL,
    "checkedInById" text,
    "checkedOutById" text,
    "bookingRef" text NOT NULL,
    status public."ReservationStatus" DEFAULT 'PENDING'::public."ReservationStatus" NOT NULL,
    "checkInDate" timestamp(3) without time zone NOT NULL,
    "checkOutDate" timestamp(3) without time zone NOT NULL,
    "actualCheckIn" timestamp(3) without time zone,
    "actualCheckOut" timestamp(3) without time zone,
    adults integer DEFAULT 1 NOT NULL,
    children integer DEFAULT 0 NOT NULL,
    "ratePerNight" double precision NOT NULL,
    "totalNights" integer DEFAULT 1 NOT NULL,
    "roomCharges" double precision DEFAULT 0 NOT NULL,
    "extraCharges" double precision DEFAULT 0 NOT NULL,
    discount double precision DEFAULT 0 NOT NULL,
    "totalAmount" double precision DEFAULT 0 NOT NULL,
    "specialRequest" text,
    notes text,
    source text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.reservations OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 40477)
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    "roleId" text NOT NULL,
    "permissionId" text NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 40451)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    description text,
    "isSystem" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 40670)
-- Name: room_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.room_types (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    description text,
    "basePrice" double precision NOT NULL,
    "maxOccupancy" integer DEFAULT 2 NOT NULL,
    amenities text[] DEFAULT ARRAY[]::text[],
    "imageUrl" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.room_types OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 40688)
-- Name: rooms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rooms (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "roomTypeId" text NOT NULL,
    number text NOT NULL,
    floor text,
    description text,
    status public."RoomStatus" DEFAULT 'AVAILABLE'::public."RoomStatus" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.rooms OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 40419)
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscriptions (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    plan public."SubscriptionPlan" DEFAULT 'STARTER'::public."SubscriptionPlan" NOT NULL,
    status public."SubscriptionStatus" DEFAULT 'TRIAL'::public."SubscriptionStatus" NOT NULL,
    "startDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endDate" timestamp(3) without time zone,
    "trialEnds" timestamp(3) without time zone,
    amount double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.subscriptions OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 40554)
-- Name: tables; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tables (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    capacity integer DEFAULT 4 NOT NULL,
    floor text,
    section text,
    status public."TableStatus" DEFAULT 'AVAILABLE'::public."TableStatus" NOT NULL,
    "qrCode" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.tables OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 40439)
-- Name: tenant_features; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant_features (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    feature text NOT NULL,
    "isEnabled" boolean DEFAULT true NOT NULL
);


ALTER TABLE public.tenant_features OWNER TO postgres;

--
-- TOC entry 246 (class 1259 OID 40861)
-- Name: tenant_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant_settings (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "taxRate" double precision DEFAULT 18 NOT NULL,
    "serviceCharge" double precision DEFAULT 0 NOT NULL,
    "invoicePrefix" text DEFAULT 'INV'::text NOT NULL,
    "kotPrefix" text DEFAULT 'KOT'::text NOT NULL,
    "bookingPrefix" text DEFAULT 'BKG'::text NOT NULL,
    "footerNote" text,
    "smtpHost" text,
    "smtpPort" integer,
    "smtpUser" text,
    "smtpPass" text,
    "smsProvider" text,
    "smsApiKey" text,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.tenant_settings OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 40399)
-- Name: tenants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenants (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    "businessType" public."BusinessType" NOT NULL,
    phone text,
    email text,
    address text,
    city text,
    state text,
    country text,
    "logoUrl" text,
    currency text DEFAULT 'INR'::text NOT NULL,
    timezone text DEFAULT 'Asia/Kolkata'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.tenants OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 40486)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "roleId" text,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    "passwordHash" text NOT NULL,
    "userRole" public."UserRole" DEFAULT 'CAPTAIN'::public."UserRole" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "lastLogin" timestamp(3) without time zone,
    "avatarUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 40799)
-- Name: vendors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendors (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    address text,
    gstin text,
    "contactName" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.vendors OWNER TO postgres;

--
-- TOC entry 5391 (class 0 OID 41139)
-- Dependencies: 247
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, action, actor, entity, "previousValue", "newValue", severity, "timestamp") FROM stdin;
782f8092-fd9f-478e-9b6b-b36eac3a8f1e	TENANT_CREATED	SuperAdmin	izhar	None	Type: RESTAURANT | Plan: ENTERPRISE | Admin: izharsayed31@gmail.com	INFO	2026-06-20 07:38:35.396
fcc56a4d-b4d9-47ed-b25d-7559061b4ba9	TENANT_SUSPENDED	SuperAdmin	izhar	Status: ACTIVE	Status: SUSPENDED	INFO	2026-06-20 07:39:10.789
ca96ca2b-a51f-4b7d-9df8-a88c1581686a	TENANT_ACTIVATED	SuperAdmin	izhar	Status: SUSPENDED	Status: ACTIVE	INFO	2026-06-20 07:39:12.336
\.


--
-- TOC entry 5370 (class 0 OID 40505)
-- Dependencies: 226
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, "tenantId", name, description, type, "createdAt") FROM stdin;
\.


--
-- TOC entry 5379 (class 0 OID 40656)
-- Dependencies: 235
-- Data for Name: folio_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.folio_items (id, "paymentId", description, amount, type, "createdAt") FROM stdin;
\.


--
-- TOC entry 5382 (class 0 OID 40706)
-- Dependencies: 238
-- Data for Name: guests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.guests (id, "tenantId", name, email, phone, "idType", "idNumber", address, city, country, nationality, "dateOfBirth", notes, "totalStays", "totalSpent", "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 5384 (class 0 OID 40760)
-- Dependencies: 240
-- Data for Name: housekeeping; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.housekeeping (id, "tenantId", "roomId", "assignedTo", status, "taskType", notes, "scheduledAt", "startedAt", "completedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 5385 (class 0 OID 40776)
-- Dependencies: 241
-- Data for Name: inventory_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_items (id, "tenantId", name, description, sku, unit, quantity, "minimumStock", "costPrice", "imageUrl", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 5377 (class 0 OID 40628)
-- Dependencies: 233
-- Data for Name: kot_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.kot_items (id, "kotId", "orderItemId", quantity, notes) FROM stdin;
6cc17b2b-3037-47f4-acdd-34c9ed0cf8cc	c17fb873-06c6-4d4c-8b38-417b0392e40c	4f3a2a88-423f-4290-8cea-50ff07f01d9b	1	extra spicy
140b95a9-cdd4-44ce-93ce-24ab56045ecb	c17fb873-06c6-4d4c-8b38-417b0392e40c	c5337129-3bd1-4b1d-9d60-c96e6c5ae5b5	1	
\.


--
-- TOC entry 5376 (class 0 OID 40612)
-- Dependencies: 232
-- Data for Name: kots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.kots (id, "tenantId", "orderId", "userId", "kotNumber", status, notes, "printedAt", "createdAt", "updatedAt") FROM stdin;
c17fb873-06c6-4d4c-8b38-417b0392e40c	5f75a454-14e0-4fee-b3a5-aef54e73b3c4	2a2cdc32-a5df-4721-918f-03aa5d694124	\N	RPK-MQLWVTXV	READY	\N	\N	2026-06-20 05:22:53.397	2026-06-20 05:25:57.365
\.


--
-- TOC entry 5371 (class 0 OID 40518)
-- Dependencies: 227
-- Data for Name: menu_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.menu_categories (id, "tenantId", name, description, "imageUrl", "sortOrder", "isActive", "createdAt") FROM stdin;
1b97a9b1-d5f7-4177-86a3-576384102ec7	5f75a454-14e0-4fee-b3a5-aef54e73b3c4	Starters	\N	\N	1	t	2026-06-20 05:13:52.982
2189bcc7-9d50-4bab-9f08-c713d7fc226b	5f75a454-14e0-4fee-b3a5-aef54e73b3c4	Mains	\N	\N	2	t	2026-06-20 05:13:52.984
8f4f8633-c366-489b-a887-26198eeb2fc7	5f75a454-14e0-4fee-b3a5-aef54e73b3c4	Desserts	\N	\N	3	t	2026-06-20 05:13:52.985
c08fd83c-a9f2-4ea2-998c-9db8e09d9b12	5f75a454-14e0-4fee-b3a5-aef54e73b3c4	Beverages	\N	\N	4	t	2026-06-20 05:13:52.985
184d3e00-6e05-4a15-8dc4-ceacbab98828	790fd1da-32b8-4ad2-b6e4-a82a76d5f070	Coffee	\N	\N	1	t	2026-06-20 05:13:52.989
23f7d611-ec37-4c03-9d8b-3cb1069df5ae	790fd1da-32b8-4ad2-b6e4-a82a76d5f070	Snacks	\N	\N	2	t	2026-06-20 05:13:52.99
2bed25f6-0413-4f8b-82e1-251214a00442	790fd1da-32b8-4ad2-b6e4-a82a76d5f070	Desserts	\N	\N	3	t	2026-06-20 05:13:52.99
\.


--
-- TOC entry 5372 (class 0 OID 40534)
-- Dependencies: 228
-- Data for Name: menu_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.menu_items (id, "tenantId", "menuCategoryId", "categoryId", name, description, price, "costPrice", "imageUrl", "isVeg", "isAvailable", "preparationTime", "sortOrder", "createdAt", "updatedAt") FROM stdin;
59607b87-c5e1-4b53-af1f-3d4c6152e849	5f75a454-14e0-4fee-b3a5-aef54e73b3c4	1b97a9b1-d5f7-4177-86a3-576384102ec7	\N	Paneer Tikka	Grilled paneer cubes marinated in spices	240	90	\N	t	t	\N	0	2026-06-20 05:13:52.986	2026-06-20 05:13:52.986
116c00a5-cb72-4613-a380-3449bf1409ee	5f75a454-14e0-4fee-b3a5-aef54e73b3c4	1b97a9b1-d5f7-4177-86a3-576384102ec7	\N	Chicken Tikka	Grilled chicken pieces marinated in spices	290	110	\N	f	t	\N	0	2026-06-20 05:13:52.986	2026-06-20 05:13:52.986
776c2065-1697-416a-b4c4-61bb98387abb	5f75a454-14e0-4fee-b3a5-aef54e73b3c4	2189bcc7-9d50-4bab-9f08-c713d7fc226b	\N	Dal Makhani	Slow cooked black lentils with butter and cream	180	60	\N	t	t	\N	0	2026-06-20 05:13:52.986	2026-06-20 05:13:52.986
7cf2efd6-a724-4a20-a9c7-296ceaf23612	5f75a454-14e0-4fee-b3a5-aef54e73b3c4	2189bcc7-9d50-4bab-9f08-c713d7fc226b	\N	Butter Chicken	Tandoori chicken cooked in rich tomato gravy	320	130	\N	f	t	\N	0	2026-06-20 05:13:52.986	2026-06-20 05:13:52.986
a4214c64-7255-42ed-a886-b3df2af13cd2	5f75a454-14e0-4fee-b3a5-aef54e73b3c4	2189bcc7-9d50-4bab-9f08-c713d7fc226b	\N	Veg Biryani	Fragrant basmati rice cooked with fresh vegetables	220	80	\N	t	t	\N	0	2026-06-20 05:13:52.986	2026-06-20 05:13:52.986
68dd8995-0caf-451b-94ed-c2b6aa43298c	5f75a454-14e0-4fee-b3a5-aef54e73b3c4	8f4f8633-c366-489b-a887-26198eeb2fc7	\N	Gulab Jamun	Sweet milk dumplings dipped in sugar syrup	90	30	\N	t	t	\N	0	2026-06-20 05:13:52.986	2026-06-20 05:13:52.986
001814d1-45e2-47f3-bc88-82461e4278e0	5f75a454-14e0-4fee-b3a5-aef54e73b3c4	8f4f8633-c366-489b-a887-26198eeb2fc7	\N	Vanilla Ice Cream	Classic vanilla flavor scoop	80	20	\N	t	t	\N	0	2026-06-20 05:13:52.986	2026-06-20 05:13:52.986
c4270817-a3d7-4e78-bbb3-0019bec0736d	5f75a454-14e0-4fee-b3a5-aef54e73b3c4	c08fd83c-a9f2-4ea2-998c-9db8e09d9b12	\N	Masala Chai	Traditional spiced indian tea	40	10	\N	t	t	\N	0	2026-06-20 05:13:52.986	2026-06-20 05:13:52.986
afc9c360-9651-4f20-a666-ffad8ea905ce	5f75a454-14e0-4fee-b3a5-aef54e73b3c4	c08fd83c-a9f2-4ea2-998c-9db8e09d9b12	\N	Fresh Lime Soda	Refreshing sweet & salty lime drink	70	15	\N	t	t	\N	0	2026-06-20 05:13:52.986	2026-06-20 05:13:52.986
0ecb381a-704e-4dfa-91fe-6aab7107f3ff	790fd1da-32b8-4ad2-b6e4-a82a76d5f070	184d3e00-6e05-4a15-8dc4-ceacbab98828	\N	Espresso	Strong black coffee	100	20	\N	t	t	\N	0	2026-06-20 05:13:52.991	2026-06-20 05:13:52.991
03feea55-0518-4b28-9d16-21c104e1b66b	790fd1da-32b8-4ad2-b6e4-a82a76d5f070	184d3e00-6e05-4a15-8dc4-ceacbab98828	\N	Cappuccino	Espresso with steamed milk foam	140	35	\N	t	t	\N	0	2026-06-20 05:13:52.991	2026-06-20 05:13:52.991
388b7be0-feff-4ea4-816c-9968d8407d8f	790fd1da-32b8-4ad2-b6e4-a82a76d5f070	184d3e00-6e05-4a15-8dc4-ceacbab98828	\N	Cafe Latte	Espresso with steamed milk	150	40	\N	t	t	\N	0	2026-06-20 05:13:52.991	2026-06-20 05:13:52.991
85fb8bc9-272f-41b5-9792-dc1c2f098e7d	790fd1da-32b8-4ad2-b6e4-a82a76d5f070	23f7d611-ec37-4c03-9d8b-3cb1069df5ae	\N	Cheese Sandwich	Grilled bread with cheddar cheese	120	35	\N	t	t	\N	0	2026-06-20 05:13:52.991	2026-06-20 05:13:52.991
ae337946-fbd8-43f6-b215-0a24ef3c17b1	790fd1da-32b8-4ad2-b6e4-a82a76d5f070	23f7d611-ec37-4c03-9d8b-3cb1069df5ae	\N	Chicken Burger	Burger with crispy chicken patty	180	65	\N	f	t	\N	0	2026-06-20 05:13:52.991	2026-06-20 05:13:52.991
6ab26c85-c62a-4ac9-b603-ae877451a2ab	790fd1da-32b8-4ad2-b6e4-a82a76d5f070	2bed25f6-0413-4f8b-82e1-251214a00442	\N	Chocolate Brownie	Rich chocolate warm brownie	160	50	\N	t	t	\N	0	2026-06-20 05:13:52.991	2026-06-20 05:13:52.991
\.


--
-- TOC entry 5375 (class 0 OID 40596)
-- Dependencies: 231
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, "orderId", "menuItemId", quantity, "unitPrice", "totalPrice", notes, "isVoid") FROM stdin;
4f3a2a88-423f-4290-8cea-50ff07f01d9b	2a2cdc32-a5df-4721-918f-03aa5d694124	59607b87-c5e1-4b53-af1f-3d4c6152e849	1	240	240	extra spicy	f
c5337129-3bd1-4b1d-9d60-c96e6c5ae5b5	2a2cdc32-a5df-4721-918f-03aa5d694124	7cf2efd6-a724-4a20-a9c7-296ceaf23612	1	320	320		f
\.


--
-- TOC entry 5374 (class 0 OID 40573)
-- Dependencies: 230
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, "tenantId", "tableId", "userId", "reservationId", "orderNumber", status, subtotal, "taxAmount", "discountAmount", "totalAmount", notes, "createdAt", "updatedAt") FROM stdin;
2a2cdc32-a5df-4721-918f-03aa5d694124	5f75a454-14e0-4fee-b3a5-aef54e73b3c4	83898621-dff2-4dfd-b5d7-963e8c0f694b	\N	\N	RPH-MQLWVTXM-YWT	SERVED	560	100.8	0	660.8	\N	2026-06-20 05:22:53.387	2026-06-20 05:26:03.181
\.


--
-- TOC entry 5378 (class 0 OID 40639)
-- Dependencies: 234
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, "tenantId", "orderId", "reservationId", "userId", amount, method, status, reference, notes, "paidAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 5367 (class 0 OID 40465)
-- Dependencies: 223
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permissions (id, module, action, description, "createdAt") FROM stdin;
\.


--
-- TOC entry 5388 (class 0 OID 40835)
-- Dependencies: 244
-- Data for Name: purchase_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchase_items (id, "purchaseId", "inventoryItemId", quantity, "unitPrice", "totalPrice") FROM stdin;
\.


--
-- TOC entry 5387 (class 0 OID 40814)
-- Dependencies: 243
-- Data for Name: purchases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchases (id, "tenantId", "vendorId", "purchaseNumber", status, subtotal, "taxAmount", "totalAmount", notes, "receivedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 5389 (class 0 OID 40848)
-- Dependencies: 245
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reports (id, "tenantId", type, data, period, "generatedAt") FROM stdin;
\.


--
-- TOC entry 5383 (class 0 OID 40726)
-- Dependencies: 239
-- Data for Name: reservations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reservations (id, "tenantId", "roomId", "guestId", "checkedInById", "checkedOutById", "bookingRef", status, "checkInDate", "checkOutDate", "actualCheckIn", "actualCheckOut", adults, children, "ratePerNight", "totalNights", "roomCharges", "extraCharges", discount, "totalAmount", "specialRequest", notes, source, "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 5368 (class 0 OID 40477)
-- Dependencies: 224
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions ("roleId", "permissionId") FROM stdin;
\.


--
-- TOC entry 5366 (class 0 OID 40451)
-- Dependencies: 222
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, "tenantId", name, description, "isSystem", "createdAt") FROM stdin;
\.


--
-- TOC entry 5380 (class 0 OID 40670)
-- Dependencies: 236
-- Data for Name: room_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.room_types (id, "tenantId", name, description, "basePrice", "maxOccupancy", amenities, "imageUrl", "isActive", "createdAt") FROM stdin;
\.


--
-- TOC entry 5381 (class 0 OID 40688)
-- Dependencies: 237
-- Data for Name: rooms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rooms (id, "tenantId", "roomTypeId", number, floor, description, status, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 5364 (class 0 OID 40419)
-- Dependencies: 220
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscriptions (id, "tenantId", plan, status, "startDate", "endDate", "trialEnds", amount, "createdAt", "updatedAt") FROM stdin;
1894a8b3-491d-4af4-81cb-f99326e0506f	5b175098-f34b-460a-b8dc-6e5042d1fb34	ENTERPRISE	ACTIVE	2026-06-20 07:38:35.374	\N	\N	14999	2026-06-20 07:38:35.374	2026-06-20 07:38:35.374
\.


--
-- TOC entry 5373 (class 0 OID 40554)
-- Dependencies: 229
-- Data for Name: tables; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tables (id, "tenantId", name, capacity, floor, section, status, "qrCode", "isActive", "createdAt", "updatedAt") FROM stdin;
e1a98d1a-6c97-4d1d-a2b0-48538fff9c77	5f75a454-14e0-4fee-b3a5-aef54e73b3c4	Table 2	4	G	Main Hall	AVAILABLE	\N	t	2026-06-20 05:13:52.979	2026-06-20 05:13:52.979
065085a7-1373-4cca-878e-bd55a43db9b7	5f75a454-14e0-4fee-b3a5-aef54e73b3c4	Table 3	6	G	VIP	AVAILABLE	\N	t	2026-06-20 05:13:52.979	2026-06-20 05:13:52.979
d7f56703-f39b-4b4d-b321-f4c3a45a3b26	5f75a454-14e0-4fee-b3a5-aef54e73b3c4	Table 4	4	G	VIP	AVAILABLE	\N	t	2026-06-20 05:13:52.979	2026-06-20 05:13:52.979
b98af03a-a09a-4641-825e-bc54bd729433	790fd1da-32b8-4ad2-b6e4-a82a76d5f070	Table C1	2	G	Inside	AVAILABLE	\N	t	2026-06-20 05:13:52.981	2026-06-20 05:13:52.981
0981998e-6814-4fa0-be39-94ae4ca07c7c	790fd1da-32b8-4ad2-b6e4-a82a76d5f070	Table C2	2	G	Inside	AVAILABLE	\N	t	2026-06-20 05:13:52.981	2026-06-20 05:13:52.981
4412254a-f7c8-493c-a79b-b792bbc9f745	790fd1da-32b8-4ad2-b6e4-a82a76d5f070	Table C3	4	G	Outdoor	AVAILABLE	\N	t	2026-06-20 05:13:52.981	2026-06-20 05:13:52.981
83898621-dff2-4dfd-b5d7-963e8c0f694b	5f75a454-14e0-4fee-b3a5-aef54e73b3c4	Table 1	2	G	Main Hall	AVAILABLE	\N	t	2026-06-20 05:13:52.979	2026-06-20 05:26:03.184
\.


--
-- TOC entry 5365 (class 0 OID 40439)
-- Dependencies: 221
-- Data for Name: tenant_features; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenant_features (id, "tenantId", feature, "isEnabled") FROM stdin;
d66eee7c-5d22-43e1-a0dc-0ecbcf6ae6e0	5b175098-f34b-460a-b8dc-6e5042d1fb34	POS	t
589543d9-1251-414d-8c57-04a02876913a	5b175098-f34b-460a-b8dc-6e5042d1fb34	ROOMS	f
2a327bdb-7ece-4fc2-baa7-7ed091b4c972	5b175098-f34b-460a-b8dc-6e5042d1fb34	HOUSEKEEPING	f
\.


--
-- TOC entry 5390 (class 0 OID 40861)
-- Dependencies: 246
-- Data for Name: tenant_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenant_settings (id, "tenantId", "taxRate", "serviceCharge", "invoicePrefix", "kotPrefix", "bookingPrefix", "footerNote", "smtpHost", "smtpPort", "smtpUser", "smtpPass", "smsProvider", "smsApiKey", "updatedAt") FROM stdin;
939d68e7-25af-4b96-8ac4-99acd2134cc6	5f75a454-14e0-4fee-b3a5-aef54e73b3c4	18	0	RPH	RPK	BKG	\N	\N	\N	\N	\N	\N	\N	2026-06-20 05:13:52.976
67de225a-aca1-4811-9b53-417ad6771fe3	790fd1da-32b8-4ad2-b6e4-a82a76d5f070	5	0	CA	CAK	BKG	\N	\N	\N	\N	\N	\N	\N	2026-06-20 05:13:52.978
f675f7f2-69a0-4c23-a89b-2ab61a44b715	c9120329-4212-4dbd-83f2-a6fa63c3f6e4	12	0	SL	KOT	SLB	\N	\N	\N	\N	\N	\N	\N	2026-06-20 05:13:52.979
11731159-d442-4a20-ada6-a9d463cc49ad	5b175098-f34b-460a-b8dc-6e5042d1fb34	18	0	INV	KOT	BKG	\N	\N	\N	\N	\N	\N	\N	2026-06-20 07:38:35.374
\.


--
-- TOC entry 5363 (class 0 OID 40399)
-- Dependencies: 219
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenants (id, name, slug, "businessType", phone, email, address, city, state, country, "logoUrl", currency, timezone, "isActive", "createdAt", "updatedAt") FROM stdin;
56e09902-5e1e-47d5-afb5-6e0ffc3860b2	Hoteloraa System Node	system	HOTEL_RESTAURANT	+919999999999	support@hoteloraa.com	\N	\N	\N	\N	\N	INR	Asia/Kolkata	t	2026-06-20 05:13:52.728	2026-06-20 05:13:52.728
5f75a454-14e0-4fee-b3a5-aef54e73b3c4	Royal Palace Hotel	royal-palace	HOTEL_RESTAURANT	+918888888881	admin@royalpalace.com	\N	\N	\N	\N	\N	INR	Asia/Kolkata	t	2026-06-20 05:13:52.964	2026-06-20 05:13:52.964
790fd1da-32b8-4ad2-b6e4-a82a76d5f070	Cafe Aroma	cafe-aroma	RESTAURANT	+918888888882	contact@cafearoma.com	\N	\N	\N	\N	\N	INR	Asia/Kolkata	t	2026-06-20 05:13:52.968	2026-06-20 05:13:52.968
c9120329-4212-4dbd-83f2-a6fa63c3f6e4	Star Lodge	star-lodge	LODGING	+918888888883	manager@starlodge.com	\N	\N	\N	\N	\N	INR	Asia/Kolkata	t	2026-06-20 05:13:52.971	2026-06-20 05:13:52.971
3e18dc81-281d-494b-9ccb-e7a1cfcc3584	Grand Oak Resort	grand-oak	HOTEL_RESTAURANT	+918888888884	admin@grandoak.com	\N	\N	\N	\N	\N	INR	Asia/Kolkata	f	2026-06-20 05:13:52.973	2026-06-20 05:13:52.973
5b175098-f34b-460a-b8dc-6e5042d1fb34	izhar	izhar	RESTAURANT	\N	\N	\N	\N	\N	\N	\N	INR	Asia/Kolkata	t	2026-06-20 07:38:35.374	2026-06-20 07:39:12.334
\.


--
-- TOC entry 5369 (class 0 OID 40486)
-- Dependencies: 225
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, "tenantId", "roleId", name, email, phone, "passwordHash", "userRole", "isActive", "lastLogin", "avatarUrl", "createdAt", "updatedAt") FROM stdin;
6e08b96d-3d8b-469a-900e-803ecfa9b537	5f75a454-14e0-4fee-b3a5-aef54e73b3c4	\N	Tanvir Hussain	tanvir@royalpalace.com	\N	$2a$12$E.kCVIxRf3EfEgX3MlWJre7hc7TCRC6.v1s94zOLiTT0KsbXF5IdS	CHEF	t	\N	\N	2026-06-20 07:32:17.383	2026-06-20 07:32:17.383
4347944e-576d-4550-88fe-f5e58dfc295b	790fd1da-32b8-4ad2-b6e4-a82a76d5f070	\N	Kabir Ahmed	contact@cafearoma.com	\N	$2a$12$E.kCVIxRf3EfEgX3MlWJre7hc7TCRC6.v1s94zOLiTT0KsbXF5IdS	TENANT_ADMIN	t	\N	\N	2026-06-20 07:32:17.389	2026-06-20 07:32:17.389
bead3615-196a-44be-9ee9-4e109e690ad1	c9120329-4212-4dbd-83f2-a6fa63c3f6e4	\N	Vikram Singh	manager@starlodge.com	\N	$2a$12$E.kCVIxRf3EfEgX3MlWJre7hc7TCRC6.v1s94zOLiTT0KsbXF5IdS	TENANT_ADMIN	t	\N	\N	2026-06-20 07:32:17.397	2026-06-20 07:32:17.397
fa480429-9164-4323-ae9d-30ec22b1f7f2	c9120329-4212-4dbd-83f2-a6fa63c3f6e4	\N	Meera Nair	receptionist@starlodge.com	\N	$2a$12$E.kCVIxRf3EfEgX3MlWJre7hc7TCRC6.v1s94zOLiTT0KsbXF5IdS	RECEPTIONIST	f	\N	\N	2026-06-20 07:32:17.4	2026-06-20 07:32:17.4
83964007-5ce7-4bad-8b5b-45fa8d8eca1c	3e18dc81-281d-494b-9ccb-e7a1cfcc3584	\N	Amit Roy	admin@grandoak.com	\N	$2a$12$E.kCVIxRf3EfEgX3MlWJre7hc7TCRC6.v1s94zOLiTT0KsbXF5IdS	TENANT_ADMIN	t	\N	\N	2026-06-20 07:32:17.403	2026-06-20 07:32:17.403
3e5dbde1-8a7b-4a29-8cf1-91cabc6d691a	790fd1da-32b8-4ad2-b6e4-a82a76d5f070	\N	Mustkim	mustkim@caferoma.com	\N	$2a$12$E.kCVIxRf3EfEgX3MlWJre7hc7TCRC6.v1s94zOLiTT0KsbXF5IdS	CASHIER	t	2026-06-20 07:33:39.651	\N	2026-06-20 07:32:17.393	2026-06-20 07:33:39.652
43650074-8c9a-4d56-a645-7e17b391b133	5f75a454-14e0-4fee-b3a5-aef54e73b3c4	\N	Ravi Verma	ravi@royalpalace.com	\N	$2a$12$E.kCVIxRf3EfEgX3MlWJre7hc7TCRC6.v1s94zOLiTT0KsbXF5IdS	CAPTAIN	t	2026-06-20 07:33:43.266	\N	2026-06-20 07:32:17.38	2026-06-20 07:33:43.268
9af30155-4c19-4077-a8d9-6c5746d4bb5f	5f75a454-14e0-4fee-b3a5-aef54e73b3c4	\N	Jubeda Khatun	admin@royalpalace.com	\N	$2a$12$E.kCVIxRf3EfEgX3MlWJre7hc7TCRC6.v1s94zOLiTT0KsbXF5IdS	TENANT_ADMIN	t	2026-06-20 07:41:37.698	\N	2026-06-20 07:32:17.375	2026-06-20 07:41:37.7
5adf86c0-a2de-48f8-8882-309ba76eaea3	5f75a454-14e0-4fee-b3a5-aef54e73b3c4	\N	Faisal Ahmed	faisal@royalpalace.com	\N	$2a$12$E.kCVIxRf3EfEgX3MlWJre7hc7TCRC6.v1s94zOLiTT0KsbXF5IdS	MANAGER	t	2026-06-20 07:41:58.461	\N	2026-06-20 07:32:17.378	2026-06-20 07:41:58.462
b2eccb61-acbb-4df1-a996-de6505dc17b6	56e09902-5e1e-47d5-afb5-6e0ffc3860b2	\N	Global Administrator	SuperAdmin@hoteloraa.com	\N	$2a$12$O7UrwtCYLLpAO/kr7jsH5.wawEDDBbIuL/mW0WlfmB73mmwKMobs2	SUPER_ADMIN	t	2026-06-20 07:48:26.962	\N	2026-06-20 07:32:17.29	2026-06-20 07:48:26.963
0473884d-319f-4d2b-b65e-efd3ddac536b	5f75a454-14e0-4fee-b3a5-aef54e73b3c4	\N	Sunita Devi	sunita@royalpalace.com	\N	$2a$12$13zQQO0vWHAy75vq/goG/eNOxw7TRAjFhDgrgxxMXmuj0ks3rIcnK	HOUSEKEEPING	t	2026-06-20 07:21:53.257	\N	2026-06-20 07:18:03.26	2026-06-20 07:21:53.259
a453a503-16d5-44e1-a3ea-3837b38dc2c1	5f75a454-14e0-4fee-b3a5-aef54e73b3c4	\N	kesfuis	izhar@royal.com	789654123	$2a$12$em0spiFykZi6qO70YASOXuU4H.B5ns.BsQc6dgf0Lc37PqaAc5HHW	CAPTAIN	t	\N	\N	2026-06-20 07:41:13.577	2026-06-20 07:41:13.577
797a7254-9608-4251-ac04-2cac5a51c445	5f75a454-14e0-4fee-b3a5-aef54e73b3c4	\N	Priya Sharma	priya@royalpalace.com	\N	$2a$12$13zQQO0vWHAy75vq/goG/eNOxw7TRAjFhDgrgxxMXmuj0ks3rIcnK	RECEPTIONIST	t	2026-06-20 07:42:19.956	\N	2026-06-20 07:18:03.177	2026-06-20 07:42:19.957
8b77e9a5-a035-4afc-bf18-2900f94a73cb	5b175098-f34b-460a-b8dc-6e5042d1fb34	\N	izhar Admin	izharsayed31@gmail.com	\N	$2a$12$tc1X9uUhguQXUZM/O1UtM.MWOcmrj.eLEXng1PAdFq8Tv.CoFoRwm	TENANT_ADMIN	t	\N	\N	2026-06-20 07:38:35.374	2026-06-20 07:56:41.36
1da1826f-dbba-417a-aede-35967c5df388	5f75a454-14e0-4fee-b3a5-aef54e73b3c4	\N	Rahul Mehta	rahul@royalpalace.com	\N	$2a$12$13zQQO0vWHAy75vq/goG/eNOxw7TRAjFhDgrgxxMXmuj0ks3rIcnK	ACCOUNTANT	t	2026-06-20 07:19:42.929	\N	2026-06-20 07:18:03.263	2026-06-20 07:19:42.932
\.


--
-- TOC entry 5386 (class 0 OID 40799)
-- Dependencies: 242
-- Data for Name: vendors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vendors (id, "tenantId", name, email, phone, address, gstin, "contactName", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 5166 (class 2606 OID 41153)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5118 (class 2606 OID 40517)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 5138 (class 2606 OID 40669)
-- Name: folio_items folio_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folio_items
    ADD CONSTRAINT folio_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5145 (class 2606 OID 40725)
-- Name: guests guests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guests
    ADD CONSTRAINT guests_pkey PRIMARY KEY (id);


--
-- TOC entry 5150 (class 2606 OID 40775)
-- Name: housekeeping housekeeping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.housekeeping
    ADD CONSTRAINT housekeeping_pkey PRIMARY KEY (id);


--
-- TOC entry 5152 (class 2606 OID 40798)
-- Name: inventory_items inventory_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5132 (class 2606 OID 40638)
-- Name: kot_items kot_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot_items
    ADD CONSTRAINT kot_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5130 (class 2606 OID 40627)
-- Name: kots kots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kots
    ADD CONSTRAINT kots_pkey PRIMARY KEY (id);


--
-- TOC entry 5120 (class 2606 OID 40533)
-- Name: menu_categories menu_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_categories
    ADD CONSTRAINT menu_categories_pkey PRIMARY KEY (id);


--
-- TOC entry 5122 (class 2606 OID 40553)
-- Name: menu_items menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5128 (class 2606 OID 40611)
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5126 (class 2606 OID 40595)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 5135 (class 2606 OID 40655)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- TOC entry 5111 (class 2606 OID 40476)
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 5159 (class 2606 OID 40847)
-- Name: purchase_items purchase_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT purchase_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5157 (class 2606 OID 40834)
-- Name: purchases purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_pkey PRIMARY KEY (id);


--
-- TOC entry 5161 (class 2606 OID 40860)
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- TOC entry 5148 (class 2606 OID 40759)
-- Name: reservations reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_pkey PRIMARY KEY (id);


--
-- TOC entry 5113 (class 2606 OID 40485)
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY ("roleId", "permissionId");


--
-- TOC entry 5107 (class 2606 OID 40464)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 5140 (class 2606 OID 40687)
-- Name: room_types room_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_types
    ADD CONSTRAINT room_types_pkey PRIMARY KEY (id);


--
-- TOC entry 5142 (class 2606 OID 40705)
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- TOC entry 5101 (class 2606 OID 40438)
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- TOC entry 5124 (class 2606 OID 40572)
-- Name: tables tables_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_pkey PRIMARY KEY (id);


--
-- TOC entry 5104 (class 2606 OID 40450)
-- Name: tenant_features tenant_features_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_features
    ADD CONSTRAINT tenant_features_pkey PRIMARY KEY (id);


--
-- TOC entry 5163 (class 2606 OID 40880)
-- Name: tenant_settings tenant_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_settings
    ADD CONSTRAINT tenant_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 5098 (class 2606 OID 40418)
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- TOC entry 5115 (class 2606 OID 40504)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5155 (class 2606 OID 40813)
-- Name: vendors vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (id);


--
-- TOC entry 5153 (class 1259 OID 40891)
-- Name: inventory_items_tenantId_sku_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "inventory_items_tenantId_sku_key" ON public.inventory_items USING btree ("tenantId", sku);


--
-- TOC entry 5133 (class 1259 OID 40887)
-- Name: payments_orderId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "payments_orderId_key" ON public.payments USING btree ("orderId");


--
-- TOC entry 5136 (class 1259 OID 40888)
-- Name: payments_reservationId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "payments_reservationId_key" ON public.payments USING btree ("reservationId");


--
-- TOC entry 5109 (class 1259 OID 40885)
-- Name: permissions_module_action_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX permissions_module_action_key ON public.permissions USING btree (module, action);


--
-- TOC entry 5146 (class 1259 OID 40890)
-- Name: reservations_bookingRef_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "reservations_bookingRef_key" ON public.reservations USING btree ("bookingRef");


--
-- TOC entry 5108 (class 1259 OID 40884)
-- Name: roles_tenantId_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "roles_tenantId_name_key" ON public.roles USING btree ("tenantId", name);


--
-- TOC entry 5143 (class 1259 OID 40889)
-- Name: rooms_tenantId_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "rooms_tenantId_number_key" ON public.rooms USING btree ("tenantId", number);


--
-- TOC entry 5102 (class 1259 OID 40882)
-- Name: subscriptions_tenantId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "subscriptions_tenantId_key" ON public.subscriptions USING btree ("tenantId");


--
-- TOC entry 5105 (class 1259 OID 40883)
-- Name: tenant_features_tenantId_feature_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "tenant_features_tenantId_feature_key" ON public.tenant_features USING btree ("tenantId", feature);


--
-- TOC entry 5164 (class 1259 OID 40892)
-- Name: tenant_settings_tenantId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "tenant_settings_tenantId_key" ON public.tenant_settings USING btree ("tenantId");


--
-- TOC entry 5099 (class 1259 OID 40881)
-- Name: tenants_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX tenants_slug_key ON public.tenants USING btree (slug);


--
-- TOC entry 5116 (class 1259 OID 40886)
-- Name: users_tenantId_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "users_tenantId_email_key" ON public.users USING btree ("tenantId", email);


--
-- TOC entry 5174 (class 2606 OID 40928)
-- Name: categories categories_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "categories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5195 (class 2606 OID 41033)
-- Name: folio_items folio_items_paymentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folio_items
    ADD CONSTRAINT "folio_items_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES public.payments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5199 (class 2606 OID 41053)
-- Name: guests guests_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guests
    ADD CONSTRAINT "guests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5205 (class 2606 OID 41093)
-- Name: housekeeping housekeeping_assignedTo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.housekeeping
    ADD CONSTRAINT "housekeeping_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5206 (class 2606 OID 41088)
-- Name: housekeeping housekeeping_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.housekeeping
    ADD CONSTRAINT "housekeeping_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public.rooms(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5207 (class 2606 OID 41083)
-- Name: housekeeping housekeeping_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.housekeeping
    ADD CONSTRAINT "housekeeping_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5208 (class 2606 OID 41098)
-- Name: inventory_items inventory_items_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT "inventory_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5189 (class 2606 OID 41003)
-- Name: kot_items kot_items_kotId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot_items
    ADD CONSTRAINT "kot_items_kotId_fkey" FOREIGN KEY ("kotId") REFERENCES public.kots(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5190 (class 2606 OID 41008)
-- Name: kot_items kot_items_orderItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot_items
    ADD CONSTRAINT "kot_items_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES public.order_items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5186 (class 2606 OID 40993)
-- Name: kots kots_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kots
    ADD CONSTRAINT "kots_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5187 (class 2606 OID 40988)
-- Name: kots kots_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kots
    ADD CONSTRAINT "kots_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5188 (class 2606 OID 40998)
-- Name: kots kots_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kots
    ADD CONSTRAINT "kots_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5175 (class 2606 OID 40933)
-- Name: menu_categories menu_categories_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_categories
    ADD CONSTRAINT "menu_categories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5176 (class 2606 OID 40948)
-- Name: menu_items menu_items_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT "menu_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5177 (class 2606 OID 40943)
-- Name: menu_items menu_items_menuCategoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT "menu_items_menuCategoryId_fkey" FOREIGN KEY ("menuCategoryId") REFERENCES public.menu_categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5178 (class 2606 OID 40938)
-- Name: menu_items menu_items_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT "menu_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5184 (class 2606 OID 40983)
-- Name: order_items order_items_menuItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES public.menu_items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5185 (class 2606 OID 40978)
-- Name: order_items order_items_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5180 (class 2606 OID 40973)
-- Name: orders orders_reservationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES public.reservations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5181 (class 2606 OID 40963)
-- Name: orders orders_tableId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES public.tables(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5182 (class 2606 OID 40958)
-- Name: orders orders_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5183 (class 2606 OID 40968)
-- Name: orders orders_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5191 (class 2606 OID 41018)
-- Name: payments payments_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5192 (class 2606 OID 41023)
-- Name: payments payments_reservationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES public.reservations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5193 (class 2606 OID 41013)
-- Name: payments payments_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5194 (class 2606 OID 41028)
-- Name: payments payments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5212 (class 2606 OID 41123)
-- Name: purchase_items purchase_items_inventoryItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT "purchase_items_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES public.inventory_items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5213 (class 2606 OID 41118)
-- Name: purchase_items purchase_items_purchaseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT "purchase_items_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES public.purchases(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5210 (class 2606 OID 41108)
-- Name: purchases purchases_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT "purchases_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5211 (class 2606 OID 41113)
-- Name: purchases purchases_vendorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT "purchases_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES public.vendors(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5214 (class 2606 OID 41128)
-- Name: reports reports_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT "reports_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5200 (class 2606 OID 41073)
-- Name: reservations reservations_checkedInById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT "reservations_checkedInById_fkey" FOREIGN KEY ("checkedInById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5201 (class 2606 OID 41078)
-- Name: reservations reservations_checkedOutById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT "reservations_checkedOutById_fkey" FOREIGN KEY ("checkedOutById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5202 (class 2606 OID 41068)
-- Name: reservations reservations_guestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT "reservations_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES public.guests(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5203 (class 2606 OID 41063)
-- Name: reservations reservations_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT "reservations_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public.rooms(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5204 (class 2606 OID 41058)
-- Name: reservations reservations_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT "reservations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5170 (class 2606 OID 40913)
-- Name: role_permissions role_permissions_permissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5171 (class 2606 OID 40908)
-- Name: role_permissions role_permissions_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5169 (class 2606 OID 40903)
-- Name: roles roles_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT "roles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5196 (class 2606 OID 41038)
-- Name: room_types room_types_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_types
    ADD CONSTRAINT "room_types_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5197 (class 2606 OID 41048)
-- Name: rooms rooms_roomTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT "rooms_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES public.room_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5198 (class 2606 OID 41043)
-- Name: rooms rooms_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT "rooms_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5167 (class 2606 OID 40893)
-- Name: subscriptions subscriptions_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT "subscriptions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5179 (class 2606 OID 40953)
-- Name: tables tables_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tables
    ADD CONSTRAINT "tables_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5168 (class 2606 OID 40898)
-- Name: tenant_features tenant_features_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_features
    ADD CONSTRAINT "tenant_features_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5215 (class 2606 OID 41133)
-- Name: tenant_settings tenant_settings_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_settings
    ADD CONSTRAINT "tenant_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5172 (class 2606 OID 40923)
-- Name: users users_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5173 (class 2606 OID 40918)
-- Name: users users_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5209 (class 2606 OID 41103)
-- Name: vendors vendors_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT "vendors_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


-- Completed on 2026-06-20 13:30:06

--
-- PostgreSQL database dump complete
--

\unrestrict Zf7L2NkeHFgZrivFnom84E4p9KZ9xMi5liyAoEHuY9EYyEHxQovBfl9QxdfWxSq

