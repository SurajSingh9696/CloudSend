<!-- draft: verify this claim (path to logo) -->
<div align="center">
  <img src="/logo.svg" width="150" alt="CloudSend Logo" />

You need to quickly share a sensitive file or private note. Then you are forced to create an account, verify your email, deal with tracking links, or permanently clutter up an inbox.

✗ Signing up for an account just to share a 2MB PDF.
✗ Worrying that a sensitive note will live in an inbox forever.
✗ Dealing with expiring links that reveal your personal email.

### CloudSend is an ephemeral, private transfer register for secure file and text sharing.

CloudSend lets you securely seal files, documents, and plain-text notes behind a 6-digit ledger code. It requires no accounts, no emails, and no tracking. Once retrieved or expired, the data is permanently wiped.

<a href="#"><img src="https://img.shields.io/badge/Live_Demo-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" /></a>

<br/>

<img src="https://img.shields.io/badge/version-1.0.0-blue.svg?style=flat-square" alt="Version 1.0.0" />
<img src="https://img.shields.io/badge/license-MIT-green.svg?style=flat-square" alt="MIT License" />
<img src="https://img.shields.io/badge/Next.js-14-black.svg?style=flat-square&logo=nextdotjs" alt="Next.js" />
<img src="https://img.shields.io/badge/React-18-blue.svg?style=flat-square&logo=react" alt="React" />
<img src="https://img.shields.io/badge/Tailwind-3-38B2AC.svg?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
<img src="https://img.shields.io/badge/MongoDB-6-47A248.svg?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB" />

[The Problem](#the-problem) • [What is CloudSend?](#what-is-cloudsend) • [Quickstart](#quickstart) • [How it Works](#how-it-works) • [Comparison](#cant-google-drive-or-pastebin-already-do-this)

`Next.js (App Router)` `MongoDB` `GridFS` `Tailwind CSS`
</div>

## The problem

We’ve all been there: you need to securely send an API key, a quick plain-text memorandum, or a sensitive PDF to a colleague. If you use Slack or Discord, that file is indexed, searchable, and stored on third-party servers forever. If you use email, it litters your outbox and their inbox, leaving a permanent trail of information you only wanted them to see once.

Current file-sharing solutions like Google Drive or Dropbox demand that you create an account, generate an overly-complex sharing link, and manage permissions. You have to explicitly log back in to revoke access, or else that link stays active indefinitely. It is maddeningly heavyweight for something that should just be a quick, disposable transfer.

## What is CloudSend?

**CloudSend is a zero-friction, ephemeral data register that lets you share files and notes without leaving a permanent digital footprint.**

```text
[ Upload File/Text ] ──> [ Generate 6-Digit Code ] ──> [ Share Code ] 
                                                              │
[ Permanently Burned ] <── [ Download / Read ] <──────────────┘
```

CloudSend works because it removes the concept of identity entirely. There are no users, no roles, and no inboxes. You drop a file into the register, you get a 6-digit code, and the recipient enters that code. By leveraging an aggressively short expiration window and an optional "Burn after retrieval" mechanism, it guarantees that your sensitive data doesn't persist.

## Quickstart

1. Clone the repository:
   ```bash
   git clone https://github.com/SurajSingh9696/CloudSend.git
   cd CloudSend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

<details>
<summary><strong>Environment & Setup Instructions</strong></summary>

You need a MongoDB database to run CloudSend. It uses GridFS to store files.
Copy the example environment file and fill in your connection string:

```bash
cp .env.example .env.local
```

Inside `.env.local`:
```env
MONGODB_URI="mongodb+srv://<user>:<password>@cluster.mongodb.net/cloudsend?retryWrites=true&w=majority"
```
</details>

## How it works

1. **Seal**: You upload a file (up to 25MB) or paste a plain-text note (up to 100k characters).
2. **Issue**: CloudSend stores the text in a MongoDB document, or the file securely in MongoDB GridFS, and issues a 6-digit ledger code.
3. **Retrieve**: The recipient goes to CloudSend, enters the code exactly as issued, and downloads the original file or copies the text.
4. **Wipe**: If "Burn after retrieval" is checked, or if the time limit expires, the database entry and GridFS chunks are permanently destroyed.

```mermaid
flowchart TD
    A[User uploads file/text] --> B{Is it a file?}
    B -- Yes --> C[Store chunks in MongoDB GridFS]
    B -- No --> D[Store text in MongoDB Document]
    C --> E[Generate 6-digit Ledger Code]
    D --> E
    E --> F[User shares code]
    F --> G[Recipient enters code]
    G --> H{Valid & Unexpired?}
    H -- Yes --> I[Serve Content]
    H -- No --> J[Return Error]
    I --> K{Burn after download?}
    K -- Yes --> L[Delete Document & GridFS chunks]
    K -- No --> M[Wait for Expiration (TTL)]
    M --> L
```

## Can't Google Drive or Pastebin already do this?

| Feature | CloudSend | The Obvious Alternative |
| :--- | :--- | :--- |
| **Account Requirement** | None. Zero friction. | Requires signup, login, and email verification. |
| **Identity Linkage** | Anonymous. No emails tracked. | Sender and receiver identities are logged. |
| **Data Persistence** | Ephemeral. Aggressive TTL and Burn-on-read. | Data persists until manually deleted. |
| **Retrieval Method** | Simple 6-digit code. | Complex URL links that can be intercepted. |
| **Use Case Focus** | Secure, temporary transfer of sensitive payloads. | Long-term collaborative storage or public broadcasting. |

## What it catches, what it doesn't, and what it costs

| Scenario | Rating | Why |
| :--- | :--- | :--- |
| **Sharing an API key or password** | Strong | "Burn after retrieval" ensures the text note is destroyed immediately after the recipient copies it. |
| **Sending a quick PDF to a client** | Strong | 25MB limit is perfect for documents, and 6-digit codes are easy to read over a call. |
| **Large video file sharing** | Not the tool | Hardcoded 25MB limit. GridFS and Next.js API routes are not optimized for massive media streams. |
| **Long-term archive** | Not the tool | Built strictly for ephemeral transfers. Max retention is 7 days. |

**What CloudSend CANNOT do today:**
- It cannot host files larger than 25MB.
- It does not encrypt files end-to-end on the client side (encryption happens at rest in MongoDB).
- It does not support directories or multi-file zip bundling natively.

## What we support

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18, Tailwind CSS, Lucide React icons, Sonner for toasts
- **Database**: MongoDB & Mongoose
- **Storage**: MongoDB GridFS for file blobs

## Community & License

CloudSend is open-source software licensed under the [MIT License](LICENSE).
If you encounter a bug or have a feature request, please open an issue on the [GitHub Issue Tracker](https://github.com/SurajSingh9696/CloudSend/issues). <!-- draft: verify this claim (issue tracker link) -->
