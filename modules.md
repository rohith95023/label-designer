# Clinical Labeling & Study Management System
## Simple Guide to System Requirements

> **Based on SRS v9.5 • For All Team Members**
>
> *Confidential — Internal Use Only*

This document explains what the Clinical Labeling & Study Management System does, in plain and simple language. Instead of reading long technical documents, you can use this guide to quickly understand what each part of the system is supposed to do and why it matters.

The system has **15 modules (sections)**. Each module handles one specific job — from creating users to printing labels on a thermal printer.

---

## What Does This System Do? (Overview)

Think of this system as a complete tool for managing labels used in clinical trials (medicine research studies). A clinical trial needs printed labels on medicine kits, patient packs, etc. This system helps teams design those labels, get them approved, and then print them — all with proper security and record-keeping.

| # | Module | Description |
|---|--------|-------------|
| 1 | **User & Access Control** | Who can log in and what they can do |
| 2 | **Languages Setup** | Set up languages (English, Arabic RTL, etc.) |
| 3 | **Label Stocks Setup** | Define paper/label sizes available for printing |
| 4 | **Objects Setup** | Upload logos, symbols, pictograms for reuse |
| 5 | **Data Placeholders** | Create smart fields that fill in real data automatically |
| 6 | **Phrases & Translations** | Store label text and translations per language |
| 7 | **Approval Groups** | Set up who needs to approve labels |
| 8 | **Label Designer** | Graphically design labels (like a mini Canva) |
| 9 | **Request Label** | Create a formal request for a label design |
| 10 | **Initiate Approval** | Start the approval process for a label |
| 11 | **Approve Label Design** | Approvers review and sign off on labels |
| 12 | **QA Approval** | Quality team does a final check before printing |
| 13 | **Protocol Planning** | Set up a clinical study and its details |
| 14 | **Biostat / Random. Data** | Generate or import randomisation data for the study |
| 15 | **Print Labels** | Send approved labels to a thermal printer |

---

## Module 1 — User Creation & Access Control

**What is this module?** This is the security front-door of the system. Before anyone can use any feature, they must be set up as a user here. The admin decides who gets access to what.

### Key Concepts (Plain English)

| Feature | What it does |
|---------|-------------|
| **Internal User** | A staff member / employee of the company. Gets broader access. |
| **External User** | A contractor, partner, or vendor. Gets limited, controlled access. |
| **Module Permission** | Which sections of the system a user can open (e.g., only Label Designer). |
| **Event Permission** | What a user can DO inside a section — Create, Complete, or Approve a record. |
| **Segregation of Duties (SoD)** | A safety rule: the person who finishes a task CANNOT be the same person who approves it. This prevents fraud / mistakes. |
| **RBAC** | Role-Based Access Control — users get a Role (like 'Designer' or 'Approver') and that role decides their permissions automatically. |
| **Electronic Signature (E-Sig)** | Instead of a paper signature, the user enters their username+password to confirm critical actions (required by FDA law). |
| **Audit Trail** | A permanent log of every action — who did what, when, and what changed. Cannot be deleted or edited. |
remove 
### What the System Must Allow Admins to Do

- Create new users and classify them as Internal or External
- Assign users to specific modules (e.g., Label Designer only)
- Assign what events a user can do — Create, Complete, or Approve
- Turn on/off the rule: *'same person cannot complete AND approve'*
- Enforce e-signatures on sensitive actions
- Record every change in an uneditable audit trail

> **Why does this matter?** Pharmaceutical regulations (FDA 21 CFR Part 11 and EU Annex 11) require that computer systems have proper user controls, e-signatures, and audit trails. Without this module, the system cannot be used legally in a pharma setting.

---

## Module 2 — Setup Master Modules

Before designing any label, the system needs some basic building blocks to be configured. Think of these as ingredients you prepare before cooking.

### Module 2A — Languages

The system supports labels in many languages (English, French, Arabic, etc.). This module is where you set those up.

| Feature | What it does |
|---------|-------------|
| **Base Language** | e.g., 'English' — the main language category |
| **Country Variant** | e.g., 'English-US', 'English-UK' — same language, different region settings |
| **LTR / RTL** | Left-to-Right (English) or Right-to-Left (Arabic, Hebrew). The system flips the whole screen layout accordingly. |
| **Active / Inactive** | Only Active languages can be selected when designing labels. Inactive ones are hidden but not deleted. |

### Module 2B — Label Stocks (Sizes)

Before printing, you need to know what physical paper/label the printer will use. This module stores the available label stock sizes.

- Each stock has an ID, a description, and dimensions (Length × Breadth × Height)
- Validation ensures no duplicate IDs and all fields are filled
- Stocks are reused when designing labels and creating print requests

### Module 2C — Objects (Images & Symbols)

Labels often need logos, safety symbols (like a 'Keep Away from Children' icon), or regulatory pictograms. This module is the image library.

| Feature | What it does |
|---------|-------------|
| **Supported Formats** | PNG, JPG, JPEG, SVG, PDF |
| **Versioning** | Each image can have multiple versions. Only ONE version can be Active at a time. Old versions are kept for history. |
| **Activation Control** | Admin must explicitly activate an image before it can be inserted into a label design. |
| **Reusability** | One uploaded object can be used across many label designs. |
| **No direct editing** | Designers cannot edit the image inside the label — changes must be made in this module first. |

### Module 2D — Data Placeholders

A data placeholder is like a smart empty box on the label that gets filled automatically when you print. For example, a placeholder called `[PATIENT_NAME]` will be replaced with the actual patient's name at print time.

| Feature | What it does |
|---------|-------------|
| **Placeholder ID** | A unique name/code for the placeholder (e.g., `PROTOCOL_NUMBER`) |
| **Description** | Plain-English description of what this placeholder represents |
| **Database Mapping** | Which exact database column provides the data at print time |
| **Lock after approval** | Once a placeholder is used in an APPROVED label, its mapping CANNOT be changed — to protect data integrity. |

### Module 2E — Phrases & Translations

Labels often have standard legal/safety phrases like *'Keep out of reach of children'*. This module stores all such phrases and their translations.

- Each phrase starts in English (the master language)
- Translations are added for each target language
- Only one translation allowed per phrase per language (no duplicates)
- RTL/LTR rendering is respected when displaying translated text on labels

### Module 2F — Approval Groups

When a label needs approval, it doesn't go to just one person — it goes to a group. This module defines those groups.

| Feature | What it does |
|---------|-------------|
| **Group** | A named set of approver users (e.g., 'EU Regulatory Team') |
| **ALL rule** | Every person in the group must approve — stricter |
| **ANY rule** | Just one person from the group needs to approve — faster |
| **Country/Language specific** | Different countries or languages can have different approval groups |

---

## Module 3 — Clinical Label Designer

**What is this?** This is the main working area — a visual design tool (like a simplified version of Canva or Word) where users drag and drop elements to create label layouts.

> **WYSIWYG = What You See Is What You Get.** The label on screen looks exactly like what will be printed.

### The Design Canvas

| Feature | What it does |
|---------|-------------|
| **Canvas size** | Set to match the chosen label stock dimensions |
| **Units** | Can be switched between inches, centimetres, or pixels |
| **Rulers & Gridlines** | Visual guides so elements are placed accurately |
| **Zoom** | Zoom in/out to work on fine details or see the full label |
| **Alignment tools** | Snap elements to the centre, left, right, or top/bottom |

### What Can You Add to a Label?

| Feature | What it does |
|---------|-------------|
| **Shapes** | Lines, rectangles, ovals — for borders and decoration |
| **Images/Objects** | Logos, regulatory symbols from the Objects module |
| **Free Text** | Any text you type manually |
| **Pre-defined Phrase** | Pull in a stored phrase (e.g., 'Store below 25°C') — auto-translates |
| **Data Placeholder** | A smart field that fills with real data at print time (e.g., batch number) |
| **Runtime Placeholder** | A field filled in by the user just before printing |
| **Visit Placeholder** | For clinical trials — shows what visit this kit is for |
| **Barcode** | Any placeholder field can also be rendered as a barcode. User picks the barcode format (QR, Code 128, etc.) |

### Other Designer Features

- **Templates:** Save a label layout as a template. Others can start from it instead of a blank canvas.
- **Versioning:** Every time you modify a label, a new version is saved. Old versions are never lost.
- **Preview:** See what the label looks like with sample data filled into placeholders before finalising.
- **Rich Text:** Bold, italic, different font sizes — all supported.
- **Multilingual:** Design once, swap language, see translated text — all on the same layout.
- **E-Signature to Finalise:** When the designer is happy with the label, they sign it electronically to lock it.

> **Compliance note:** Every action in the designer is logged automatically (who changed what, when). This satisfies GxP and FDA 21 CFR Part 11 requirements.

---

## Module 4 — Label Lifecycle: From Request to Print

A label goes through several steps before it can be printed. Think of it like a document approval workflow — each step must be completed before moving to the next.

| Step | Module | What happens | Status after |
|------|--------|-------------|--------------|
| 1 | Request Label | Someone requests a label — gives it an ID and description | Draft |
| 2 | Label Designer | Designer creates the label layout on the canvas | Designed |
| 3 | Request Label (Complete) | Designer marks label as complete with e-signature | Completed |
| 4 | Initiate Approval | Assign approver groups and start the approval process | Under Approval |
| 5 | Approve Label Design | Approvers review and sign off (or reject) | Approved / Rejected |
| 6* | QA Approval | Optional: QA team does final review and signs off | Approved (QA) |
| 7 | Create Print Request | Link label to a study protocol, fill runtime data, approve print | Print Ready |
| 8 | Print Labels | Send to thermal printer — system tracks print status | Printed |

> \* Step 6 (QA Approval) is optional — only needed for labels that require it.

### Label Status Meanings

| Status | What it means |
|--------|--------------|
| **Draft** | Label was requested but not yet designed |
| **Completed** | Designer has finished and signed off the label |
| **Under Approval** | Label is waiting for approvers to review it |
| **Approved** | All required approvals received — label is official |
| **Rejected** | An approver rejected it — must be revised and resubmitted |
| **QA Review** | Waiting for QA team's final check |
| **Printed** | Label has been successfully sent to the printer |

---

## Module 5 — Protocol Planning & Study Setup

A Protocol (also called a Study) is the clinical trial itself. Before printing any labels for a trial, the trial must be set up in the system. This section handles that setup.

### Study Types

| Feature | What it does |
|---------|-------------|
| **Open** | Everyone knows which treatment a patient receives. Simple. |
| **Open Composite** | Open study, but kits contain a mix of treatments. |
| **Open Discrete** | Open study with individually numbered kits. |
| **Blinded – Kit-based** | Kits are pre-packaged; nobody knows which kit has which drug. Randomisation is based on kit numbers and visit schedule. |
| **Blinded – Patient-based** | Assignment is done per patient. The system randomly assigns treatments to patients without revealing which is active drug. |

### What You Set Up in Protocol Planning

- Protocol name, description, and which countries are part of the study
- Treatment groups (e.g., Group A = Drug, Group B = Placebo)
- Treatment assignments — how many patients or kits, how many visits
- Lifecycle management: Draft → Planned → Active → Closed

### Biostatistics / Randomisation Data

For blinded studies, the system needs a randomisation list — a secret list that says which patient or kit gets which treatment. This is called **Biostat Data**.

| Feature | What it does |
|---------|-------------|
| **System-generated** | The system creates the randomisation list automatically |
| **Imported** | Upload an Excel/CSV file prepared by a biostatistician |
| **Immutable after approval** | Once the biostat data is approved with e-signature, it CANNOT be changed — ensures trial integrity |

---

## Module 6 — Print Request & Label Printing

Once a label is approved and a study is set up, the final step is to request printing and then actually print the labels.

### Create Print Request

- Select the study protocol and the approved label design to use
- The system automatically fills in data placeholders from the study database
- Users fill in Runtime Placeholders manually at this stage (e.g., site code)
- **Subset printing:** you can print labels for just SOME kits or patients, not all
- Preview what the final label will look like with all data filled in
- Complete and approve the print request with e-signatures

### Print Labels

- System shows all print requests that are approved and ready
- User selects a thermal printer from available printers
- System checks the printer is compatible with the label stock
- Print job is sent — system tracks the status in real-time
- If printing fails, user can retry or reassign to a different printer

| Print Status | Meaning |
|-------------|---------|
| **Printing** | Job has been sent to the printer and is in progress |
| **Printed** | Job completed successfully — labels are out |
| **Failed** | Something went wrong — user can retry |

---

## Module 7 — Compliance, Audit Trail & E-Signatures

> **This section applies to EVERY module in the system. It's not optional — it's a legal requirement for pharmaceutical software.**

### Electronic Signatures (E-Sig)

An electronic signature means the user enters their username and password to confirm a critical action. It is legally equivalent to a handwritten signature.

- Required for: completing a label, approving a label, completing biostat data, approving print requests
- The signature is recorded with: who signed, what they signed, when, and why
- 3 failed attempts → account is temporarily locked and admins are notified
- Session nearing timeout during signing → system extends it automatically

### Audit Trail

Every action anyone takes in the system is automatically recorded in a permanent log. This log can **never** be edited or deleted.

| Feature | What it does |
|---------|-------------|
| **Who** | Which user performed the action |
| **When** | Exact date and time (to the second) |
| **What** | What type of action was performed (create / edit / approve / etc.) |
| **Before & After** | For edits: what the value was before and what it changed to |
| **Reason** | User can (or must) enter a reason for the change |
| **Tamper-proof** | Cryptographic hashing ensures nobody can secretly modify audit records |
| **Retention** | Records kept for the regulatory-required period (defined by 21 CFR Part 11) |

### Regulatory Standards Supported

| Standard | Description |
|----------|-------------|
| **21 CFR Part 11** | US FDA regulation for electronic records and signatures in pharma |
| **EU Annex 11** | European equivalent regulation for computerised systems in pharma |
| **GxP** | Good Practices (GMP, GCP, GLP) — general quality standards for pharma |

---

## How All the Modules Connect

The modules are not standalone — they depend on each other. Here is how data flows through the system:

| From | To | How they connect |
|------|-----|----------------|
| Users & Security | All Modules | Every module checks the user's permissions before allowing any action. |
| Language Setup | Label Designer + Phrases | Languages defined here are available when choosing label language in the designer. |
| Label Stocks | Label Designer + Print Request | The stock chosen in designer must be available; print request validates compatibility. |
| Objects (Images) | Label Designer | Only active objects from the library can be inserted into label designs. |
| Data Placeholders | Label Designer + Print Request | Placeholders designed into labels are resolved with real data during print. |
| Phrases | Label Designer | Stored phrases (with translations) can be added to any label design. |
| Approval Groups | Initiate Approval + Approve Label | Groups set up here are assigned when initiating the approval workflow. |
| Protocol Planning | Biostat Data + Print Request | The study setup drives which data is generated and what gets printed. |
| Biostat Data | Print Request | Approved randomisation data is used to fill patient/kit data at print time. |
| Label Designer | Request Label + Approval + Print | The designed label is what flows through request → approval → print. |

---

## Quick Reference — Who Uses What?

| Role | Modules They Use | What They Do |
|------|-----------------|-------------|
| **System Admin** | User & Access, All Setup Modules | Create users, set permissions, configure languages/stocks/objects/groups |
| **Label Designer** | Label Designer, Request Label | Design label layouts, use placeholders, finalise with e-signature |
| **Approver** | Approve Label Design | Review labels, approve or reject with e-signature |
| **QA Officer** | QA Approval Label | Final quality review and approval of labels needing QA sign-off |
| **Study Manager** | Protocol Planning, Biostat Data | Set up clinical trials, manage randomisation data |
| **Print Operator** | Create Print Request, Print Labels | Set up print jobs, select printer, monitor printing |

---

## Glossary — Difficult Words Explained

| Term | Definition |
|------|-----------|
| **21 CFR Part 11** | A US FDA rule requiring electronic records/signatures to be secure, trustworthy, and equivalent to paper ones. |
| **Annex 11** | The European version of 21 CFR Part 11. |
| **Audit Trail** | A permanent record of who did what and when — cannot be changed. |
| **Biostat Data** | Randomisation data from statisticians that determines which patient gets which treatment in a blinded study. |
| **Blinded Study** | A trial where patients (and sometimes doctors) don't know who gets the real drug vs. placebo. |
| **Canvas** | The design area in the Label Designer — like a blank page you draw on. |
| **Clinical Trial** | A research study on humans to test whether a medicine works. |
| **Data Placeholder** | A named slot on a label that is automatically filled with real data from a database at print time. |
| **E-Signature** | Entering your username and password to legally confirm an action — same legal weight as a handwritten signature. |
| **Event** | A specific action in the system (e.g., Create, Complete, Approve). |
| **GxP** | Good Practice guidelines in pharma — includes GMP (manufacturing), GCP (clinical), GLP (laboratory). |
| **Kit** | A packaged unit of medicine for a clinical trial participant. |
| **Label Stock** | The physical paper/label material that goes into the printer. |
| **LTR / RTL** | Left-to-Right (e.g., English) / Right-to-Left (e.g., Arabic) text direction. |
| **Module** | A section of the software that handles one specific area of work. |
| **Open Study** | Everyone knows who gets which treatment — not blinded. |
| **Phrase** | A pre-written text snippet (e.g., a legal warning) stored centrally with translations. |
| **Pictogram** | A small picture/icon used on labels — e.g., a flame for flammable items. |
| **Protocol** | The official plan and rules for a clinical trial. |
| **RBAC** | Role-Based Access Control — permissions come from the user's role, not set individually. |
| **Randomisation** | Randomly assigning patients to treatment or placebo groups to make the study scientifically valid. |
| **Runtime Placeholder** | A placeholder filled manually by the user at print time, not from a database. |
| **SoD** | Segregation of Duties — the person who does a task cannot also approve it. |
| **Thermal Printer** | A printer that uses heat instead of ink — common for labels in pharma. |
| **WYSIWYG** | What You See Is What You Get — the design on screen = what gets printed. |

---

> **Summary:** This system manages the full lifecycle of clinical trial labels — from setting up users and design elements, to designing labels, getting them approved, linking them to a study, and finally printing them on a thermal printer. Everything is tracked, signed, and audited to meet pharmaceutical regulations.

*This guide is a simplified explanation based on SRS v9.5. For full technical specifications, refer to the original source documents.*