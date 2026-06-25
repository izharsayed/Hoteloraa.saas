# Hotaloraa SaaS Architecture & System Design Document

## 1. Project Overview

Hotaloraa is a multi-tenant SaaS platform designed for:

* Restaurant Management
* Lodging / Hotel Management
* Hotel + Restaurant Management

The platform uses Feature-Based Access Control and Role-Based Access Control (RBAC) to enable different modules based on business requirements.

---

# 2. Business Types

## Restaurant Only

Enabled Modules:

* Dashboard
* POS Billing
* Table Management
* Kitchen Order Ticket (KOT)
* Menu Management
* Inventory
* Reports

Disabled Modules:

* Rooms
* Reservations
* Housekeeping

---

## Lodging Only

Enabled Modules:

* Dashboard
* Reservations
* Rooms
* Check-In
* Check-Out
* Guests
* Housekeeping
* Reports

Disabled Modules:

* POS
* Tables
* KOT

---

## Hotel + Restaurant

Enabled Modules:

* Reservations
* Rooms
* Guests
* Check-In
* Check-Out
* Housekeeping
* POS Billing
* Tables
* KOT
* Menu Management
* Inventory
* Reports
* Guest Folio
* Room Service

---

# 3. Multi-Tenant Architecture

## Tenant

A Tenant represents a customer organization.

Examples:

* Royal Palace Hotel
* Cafe Aroma
* Star Lodge

Each tenant has:

* Own Users
* Own Data
* Own Roles
* Own Features
* Own Subscription

---

# 4. User Hierarchy

## Super Admin

Platform Owner

Permissions:

* Create Tenant
* Suspend Tenant
* Activate Tenant
* Manage Plans
* Manage Features
* View Global Reports
* Manage Subscriptions

---

## Tenant Admin

Business Owner

Permissions:

* Manage Users
* Manage Roles
* View Reports
* Manage Business Settings

---

## Manager

Permissions:

* View All Operations
* Reports
* Revenue
* Inventory

---

## Receptionist

Permissions:

* Reservations
* Check-In
* Check-Out
* Guest Management

---

## Captain

Permissions:

* Table Management
* Create Orders
* Update Orders
* Serve Orders

---

## Cashier

Permissions:

* Generate Bills
* Receive Payments
* Refunds

---

## Kitchen Staff

Permissions:

* View KOT
* Mark Preparing
* Mark Ready

---

## Housekeeping

Permissions:

* View Assigned Rooms
* Update Cleaning Status

---

## Inventory Manager

Permissions:

* Manage Inventory
* Purchases
* Vendors

---

# 5. Restaurant Workflow

Customer Arrives
↓
Table Assigned
↓
Captain Takes Order
↓
Order Sent To KOT
↓
Kitchen Prepares Food
↓
Ready For Service
↓
Captain Serves
↓
Cashier Generates Bill
↓
Payment Completed

Order Status Flow:

Draft
↓
Sent To Kitchen
↓
Preparing
↓
Ready
↓
Served
↓
Billed
↓
Paid

---

# 6. Lodging Workflow

Reservation
↓
Check-In
↓
Room Allocation
↓
Guest Stay
↓
Services Added
↓
Check-Out
↓
Payment

Room Status Flow:

Available
↓
Reserved
↓
Occupied
↓
Dirty
↓
Cleaning
↓
Available

Additional Status:

* Maintenance
* Out Of Service

---

# 7. Hotel + Restaurant Workflow

Guest Reservation
↓
Check-In
↓
Room Assigned
↓
Guest Orders Food
↓
Order Sent To KOT
↓
Kitchen Prepares Food
↓
Food Delivered To Room
↓
Charges Added To Guest Folio
↓
Check-Out
↓
Final Invoice Generated

---

# 8. Guest Folio System

Guest Folio stores all guest charges.

Examples:

* Room Charges
* Restaurant Orders
* Laundry
* Mini Bar
* Room Service

Final Invoice Example:

Room Charges: ₹3000

Restaurant: ₹650

Laundry: ₹200

Mini Bar: ₹300

Total: ₹4150

---

# 9. RBAC Structure

Role-Based Access Control uses permissions.

Avoid:

if(user.role === "manager")

Use:

authorize("reservation.create")

authorize("room.checkin")

authorize("kot.update")

authorize("billing.generate")

Examples:

* room.view
* room.create
* reservation.create
* kot.update
* billing.generate
* inventory.update

---

# 10. Backend Folder Structure

backend/

├── src/

│ ├── config/

│ ├── middleware/

│ ├── modules/

│ │ ├── auth/

│ │ ├── users/

│ │ ├── roles/

│ │ ├── permissions/

│ │ ├── tenants/

│ │ ├── subscriptions/

│ │ ├── features/

│ │ ├── dashboard/

│ │ ├── rooms/

│ │ ├── room-types/

│ │ ├── reservations/

│ │ ├── checkin/

│ │ ├── checkout/

│ │ ├── guests/

│ │ ├── housekeeping/

│ │ ├── pos/

│ │ ├── tables/

│ │ ├── menu/

│ │ ├── categories/

│ │ ├── orders/

│ │ ├── kot/

│ │ ├── billing/

│ │ ├── inventory/

│ │ ├── purchases/

│ │ ├── vendors/

│ │ ├── folio/

│ │ ├── payments/

│ │ ├── reports/

│ │ └── settings/

│ ├── shared/

│ ├── routes/

│ └── app.ts

├── prisma/

├── uploads/

└── package.json

---

# 11. Frontend Folder Structure

frontend/

├── components/

├── pages/

├── services/

├── hooks/

├── store/

├── routes/

├── types/

└── utils/

---

# 12. Development Roadmap

Phase 1

* Authentication
* Multi-Tenant
* RBAC
* Feature Flags

Phase 2

* Rooms
* Reservations
* Check-In
* Check-Out

Phase 3

* POS
* Tables
* Orders
* KOT

Phase 4

* Billing
* Payments
* Guest Folio

Phase 5

* Inventory
* Vendors
* Purchases

Phase 6

* Reports
* Analytics
* Subscription Management

---

# 13. Future Enhancements

* Multi-Branch Support
* Mobile App
* QR Menu Ordering
* Online Booking Engine
* WhatsApp Notifications
* AI Revenue Analytics
* Customer Loyalty Program
* Staff Payroll
* Maintenance Module
* CRM System

---

# 14. Hoteloraa Design System & Brand Guidelines

## Design Philosophy

Hoteloraa follows a Premium Hospitality UI inspired by luxury boutique hotels, premium cafés, and modern property management systems.

The design focuses on:

* Clean interfaces
* Warm hospitality feel
* Minimal visual clutter
* Premium appearance
* Fast operational workflows
* Enterprise-grade usability

The platform avoids overly colorful dashboards and instead uses elegant neutral tones with carefully selected gold accents.

---

# Brand Identity

Brand Name: Hoteloraa

Brand Personality:

* Premium
* Elegant
* Modern
* Professional
* Hospitality Focused

Design Goals:

* Easy for reception staff
* Easy for restaurant staff
* Easy for hotel managers
* Clean enough for daily operational use
* Consistent across all modules

---

# Color Palette

## Global Canvas

Background Color

```css
#FEF9F1
```

Warm Ivory / Soft Cream

Used for:

* Main application background
* Dashboard canvas
* Login background

---

## Primary Color

```css
#0B1F3A
```

Deep Classic Navy

Used for:

* Headers
* Navigation
* Primary buttons
* Important actions
* Page titles

---

## Secondary Color

```css
#6B7280
```

Slate Gray

Used for:

* Labels
* Helper text
* Metadata
* Secondary content

---

## Brand Accent

```css
#D4AF37
```

Matte Gold

Used for:

* Branding
* Premium highlights
* Revenue cards
* Important badges

---

## Accent Light

```css
#E5C054
```

Rich Yellow Gold

Used for:

* Hover states
* Active tabs
* Selected items
* Focus rings

---

## Accent Pale

```css
#FAF7EE
```

Pale Gold

Used for:

* Soft highlights
* Background chips
* Status containers

---

## Success

```css
#1E9E6A
```

Emerald Green

Used for:

* Available Rooms
* Free Tables
* Success Messages
* Completed Orders

---

## Danger

```css
#D94A4A
```

Soft Crimson

Used for:

* Occupied Tables
* Error Messages
* Delete Actions
* Delayed Orders

---

## Warning

```css
#F59E0B
```

Deep Amber

Used for:

* Reserved Tables
* Pending Status
* Warning Notifications

---

## Surface

```css
#FFFFFF
```

Pure White

Used for:

* Cards
* Sheets
* Forms
* Dialogs

---

## Surface Alternative

```css
#F4EFE6
```

Soft Linen

Used for:

* Sidebar
* Secondary panels
* Section backgrounds

---

## Border Color

```css
#EBE5DA
```

Used for:

* Dividers
* Card borders
* Table separators

---

# Typography System

## Display Font

Lora

Used for:

* Dashboard titles
* Hotel names
* Table numbers
* Premium headings

Example:

```text
Reservations
Room 204
Table 15
```

---

## UI Font

Inter

Used for:

* Menus
* Forms
* Reports
* Lists
* Buttons

---

## Numeric Font

JetBrains Mono

Used for:

* Invoice numbers
* Prices
* Order IDs
* Loyalty Points
* Reports

Example:

```text
INV-2026-001
₹4,150
KOT-120
```

---

# Canvas Grid System

Application Background:

```css
background-color: #FEF9F1;
background-image:
radial-gradient(#EBE5DA 1.5px, transparent 1.5px);
background-size: 24px 24px;
```

Purpose:

* Architectural blueprint feel
* Luxury hospitality appearance
* Better visual depth

---

# Login Page Design

File:

```text
frontend/src/pages/Login.jsx
```

Layout:

* Center aligned
* Floating card
* Warm cream background
* Soft luxury shadow

Card Style:

```css
rounded-[2rem]
shadow-xl
shadow-stone-200/30
```

---

# Login Components

## Logo

Top centered

```text
Hoteloraa
```

Logo:

```text
logo_horizontal.png
```

---

## Email Field

Components:

* Envelope Icon
* Email Input

---

## Password Field

Components:

* Lock Icon
* Password Input
* Show / Hide Toggle

---

## Remember Me

Checkbox

---

## Forgot Password

Text Link

---

# Demo Login Switcher

Roles:

Super Admin

```text
SuperAdmin@hoteloraa.com
```

Manager

```text
ManagerSunita@hoteloraa.com
```

Cashier

```text
CashierRahul@hoteloraa.com
```

Kitchen Staff

```text
KitchenKishore@hoteloraa.com
```

Clicking a role:

* Auto fills credentials
* Updates selected state
* Uses gold active border

---

# Restaurant Floor Layout

Zones:

* All Tables
* Main Hall
* Garden Terrace
* VIP Lounge

---

# Table Design

Supported Shapes:

* Circle
* Square
* Rectangle

Chair indicators around tables.

---

# Table Status Colors

Available

```css
#1E9E6A
```

Occupied

```css
#D94A4A
```

Reserved

```css
#F59E0B
```

---

# Live Restaurant Sidebar

Displays:

* Occupancy Percentage
* Active Tables
* Running Orders
* Pending Bills
* Live Revenue

---

# Dashboard Design Rules

DO:

* Use cards
* Use whitespace
* Use subtle shadows
* Use maximum 2 accent colors
* Use consistent spacing

DO NOT:

* Use colorful charts everywhere
* Use bright neon colors
* Overcrowd screens
* Use more than 4 status colors

---

# Premium UI Principles

Every page should follow:

1. Clean Layout
2. Large Readable Typography
3. Minimal Color Usage
4. Operational Speed First
5. Mobile Responsive
6. Accessible Controls
7. Consistent Component Library
8. Hospitality-Focused User Experience

End of Document

