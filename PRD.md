# Product Requirements Document (PRD)
## Pokleh Enterprise — Ice Distribution Management System

**Versi:** 1.0  
**Tarikh:** Jun 2026  
**Status:** Production Ready (v1)  
**Pemilik Produk:** Pokleh Enterprise  

---

## 1. Ringkasan Eksekutif

Pokleh Enterprise adalah sistem pengurusan perniagaan pengagihan ais yang dibina untuk mendigitalkan dan mengautomasikan operasi harian — dari rekod stok, jualan, pengurusan hutang pelanggan, perbelanjaan, hingga penutupan harian dan penyesuaian pembekal. Sistem ini direka untuk digunakan oleh pemilik perniagaan (admin) dan kakitangan penghantaran (staff) di lapangan, dengan sokongan **offline-first** untuk kawasan yang mungkin tiada sambungan internet yang stabil.

---

## 2. Masalah Yang Diselesaikan

| Masalah Semasa | Penyelesaian dalam Sistem |
|---------------|--------------------------|
| Rekod stok manual dalam buku / kertas | Sistem digital dengan tracking intake → distribusi → pulangan |
| Susah jejak hutang pelanggan | Debt ledger append-only dengan baki real-time |
| Tidak tahu untung rugi harian | Daily closing dengan pengiraan automatik profit |
| Tiada kawalan siapa buat apa | Role-based access (admin/staff) + audit log lengkap |
| Gangguan internet di lapangan | Offline-first: simpan data tempatan, sync bila online |
| Sukar kira amount bayar kepada pembekal | Supplier settlement dikira automatik berdasarkan stok |

---

## 3. Pengguna Sasaran

### 3.1 Persona Utama

#### Admin (Pemilik / Pengurus)
- **Siapa:** Pemilik perniagaan atau pengurus operasi
- **Keperluan:** Lihat gambaran keseluruhan perniagaan, urus kakitangan, sahkan penutupan harian, analisis laporan
- **Akses:** Penuh — semua modul termasuk audit log dan pengurusan akaun
- **Penggunaan:** Biasanya pagi (semak laporan), petang/malam (penutupan harian)

#### Staff (Kakitangan Penghantaran)
- **Siapa:** Pekerja yang urus penghantaran ais ke kawasan
- **Keperluan:** Rekod jualan, kumpul hutang, catat stok pulangan
- **Akses:** Terhad kepada kawasan yang ditetapkan
- **Penggunaan:** Sepanjang hari semasa operasi penghantaran

---

## 4. Skop Produk

### 4.1 Dalam Skop (v1.0)

| Modul | Fungsi |
|-------|--------|
| **Pengesahan** | Daftar masuk/keluar, pemulihan sesi |
| **Kawasan** | CRUD kawasan penghantaran |
| **Pelanggan** | CRUD pelanggan, tracking baki hutang |
| **Pembekal** | CRUD pembekal, sejarah harga |
| **Tugasan Kakitangan** | Assign kakitangan ke kawasan |
| **Stok Intake** | Rekod pengambilan stok dari pembekal |
| **Stok Distribusi** | Agih stok ke kawasan |
| **Stok Pulangan** | Rekod stok tak terjual |
| **Jualan** | Rekod jualan (tunai/hutang) |
| **Ledger Hutang** | Tracking perubahan hutang (append-only) |
| **Kutipan Hutang** | Rekod pembayaran hutang |
| **Perbelanjaan** | Rekod kos operasi |
| **Settlement Pembekal** | Kira dan settle pembayaran pembekal |
| **Penutupan Harian** | Rekonsiliasi end-of-day per kawasan |
| **Laporan** | Jualan, perbelanjaan, kutipan, keuntungan |
| **Log Audit** | Jejak semua perubahan kewangan (admin) |
| **Urus Akaun Staff** | Admin urus akaun pengguna |
| **Guided Tour** | Onboarding untuk pengguna baru |
| **PWA / Offline** | Boleh install, boleh guna tanpa internet |

### 4.2 Luar Skop (v1.0)

- Notifikasi push / SMS
- Multi-tenancy (banyak syarikat dalam satu instance)
- Integrasi sistem perakaunan luaran (QuickBooks, Xero)
- Penjanaan invois / resit automatik (kecuali PDF report)
- Pengesahan dua faktor (2FA)

---

## 5. Keperluan Fungsian

### 5.1 Modul Pengesahan

**FR-AUTH-01:** Sistem membenarkan pengguna daftar dengan email dan kata laluan.  
**FR-AUTH-02:** Sistem membenarkan pengguna log masuk dengan email dan kata laluan.  
**FR-AUTH-03:** Sesi pengguna dipulihkan secara automatik apabila membuka semula aplikasi.  
**FR-AUTH-04:** Pengguna baru akan melalui guided tour sewaktu login pertama.  
**FR-AUTH-05:** Admin boleh log masuk dan memadam akaun kakitangan.

---

### 5.2 Modul Stok

**FR-STOCK-01:** Admin/staff boleh rekod pengambilan stok (intake) dengan maklumat pembekal, kuantiti, dan harga kos per pax.  
**FR-STOCK-02:** Stok boleh diagihkan ke pelbagai kawasan; jumlah agihan tidak boleh melebihi jumlah diterima.  
**FR-STOCK-03:** Stok yang tidak terjual boleh direkodkan sebagai pulangan; kuantiti pulangan tidak boleh melebihi kuantiti diagih.  
**FR-STOCK-04:** Sistem mengira jumlah terjual dan pulangan untuk setiap rekod intake melalui RPC.

---

### 5.3 Modul Jualan & Hutang

**FR-SALES-01:** Staff boleh rekod jualan kepada pelanggan dengan pilihan bayaran tunai atau hutang.  
**FR-SALES-02:** Jualan dengan payment_type='debt' secara automatik menambah entri ke debt_ledger.  
**FR-SALES-03:** Debt ledger adalah append-only; tiada kemaskini atau pemadaman dibenarkan.  
**FR-SALES-04:** Setiap entri ledger menyimpan baki_sebelum dan baki_selepas untuk auditabiliti.  
**FR-SALES-05:** Staff boleh rekod kutipan hutang pelanggan.  
**FR-SALES-06:** Baki hutang pelanggan dikemas kini secara automatik melalui trigger database.

---

### 5.4 Modul Settlement Pembekal

**FR-SETTLE-01:** Sistem mengira jumlah perlu dibayar kepada pembekal berdasarkan formula: `(received - returned) × cost_per_pax`.  
**FR-SETTLE-02:** Status settlement: `pending` → `settled`.  
**FR-SETTLE-03:** Admin boleh tandakan settlement sebagai selesai.

---

### 5.5 Modul Penutupan Harian

**FR-CLOSE-01:** Setiap kawasan mempunyai rekod penutupan harian berasingan.  
**FR-CLOSE-02:** Sebelum menutup, sistem mengesahkan: `total_assigned == total_sold + total_returned`. Jika gagal, penutupan ditolak.  
**FR-CLOSE-03:** Penutupan mengikut state machine: `open → closed → reconciled`.  
**FR-CLOSE-04:** Rekod yang sudah `closed` atau `reconciled` tidak boleh diubah semula.  
**FR-CLOSE-05:** Sistem mengira profit harian secara automatik semasa penutupan.

---

### 5.6 Modul Laporan

**FR-RPT-01:** Admin dan staff boleh lihat laporan jualan mengikut tarikh dan kawasan.  
**FR-RPT-02:** Laporan perbelanjaan dipaparkan mengikut kategori.  
**FR-RPT-03:** Laporan kutipan hutang menunjukkan pembayaran mengikut tempoh.  
**FR-RPT-04:** Laporan keuntungan menunjukkan anggaran profit harian.  
**FR-RPT-05:** Semua laporan boleh dieksport sebagai PDF.  
**FR-RPT-06:** Carta visualisasi menggunakan Recharts.

---

### 5.7 Log Audit

**FR-AUDIT-01:** Semua operasi INSERT/UPDATE/DELETE pada jadual kewangan direkodkan secara automatik oleh trigger PostgreSQL.  
**FR-AUDIT-02:** Setiap log menyimpan: user_id, action, entity, nilai_lama, nilai_baru, masa.  
**FR-AUDIT-03:** Hanya admin boleh mengakses log audit.

---

### 5.8 Offline & Sync

**FR-OFFLINE-01:** Aplikasi boleh digunakan sepenuhnya tanpa sambungan internet.  
**FR-OFFLINE-02:** Data yang dimasukkan semasa offline disimpan dalam IndexedDB (Dexie).  
**FR-OFFLINE-03:** Apabila sambungan dipulihkan, data disync secara automatik ke Supabase.  
**FR-OFFLINE-04:** Jadual kewangan hanya membenarkan INSERT semasa sync (tiada UPDATE/DELETE pada rekod lama).  
**FR-OFFLINE-05:** Sistem menggunakan exponential backoff untuk retry yang gagal (max 5 percubaan).

---

## 6. Keperluan Bukan Fungsian

### 6.1 Prestasi
- **NFR-PERF-01:** Halaman dashboard muat dalam < 2 saat pada sambungan 4G.
- **NFR-PERF-02:** Query database dioptimumkan dengan indeks pada kolum yang kerap difilter (tarikh, area_id, customer_id).

### 6.2 Keselamatan
- **NFR-SEC-01:** Semua jadual mempunyai Row Level Security (RLS) aktif.
- **NFR-SEC-02:** Staff hanya boleh baca/tulis data kawasan mereka sendiri.
- **NFR-SEC-03:** Admin functions menggunakan `SECURITY DEFINER` dengan `search_path` yang ditetapkan.
- **NFR-SEC-04:** Tiada password atau kunci API tersimpan dalam kod sumber.
- **NFR-SEC-05:** Input form divalidasi menggunakan Zod schema.

### 6.3 Kebolehgunaan
- **NFR-UX-01:** UI responsif — berfungsi pada mobile (320px) hingga desktop (1440px+).
- **NFR-UX-02:** Aplikasi boleh dipasang sebagai PWA pada iOS dan Android.
- **NFR-UX-03:** Toast notifications memberikan maklumbalas segera untuk semua operasi.
- **NFR-UX-04:** Guided tour untuk onboarding pengguna baru.

### 6.4 Kebolehpercayaan
- **NFR-REL-01:** Operasi tulis menggunakan optimistic UI — rollback jika server gagal.
- **NFR-REL-02:** Offline mode memastikan tiada data hilang walau tanpa internet.
- **NFR-REL-03:** Audit log memastikan semua perubahan kewangan boleh dikesan.

### 6.5 Kebolehskalaan
- **NFR-SCALE-01:** Supabase PostgreSQL menyokong sehingga ratusan ribu rekod tanpa perubahan skema.
- **NFR-SCALE-02:** RLS policies membolehkan multi-staff tanpa perubahan kod.

---

## 7. Aliran Pengguna (User Flows)

### 7.1 Aliran Operasi Harian (Staff)

```
Login
  │
  ├─▶ Dashboard (semak KPI: hutang, pelanggan, kawasan)
  │
  ├─▶ Stock Intake (rekod ais diterima pagi)
  │     └─▶ Stock Distribution (agih ke kawasan)
  │
  ├─▶ [Sepanjang hari] Sales Entry (rekod jualan)
  │     ├── cash: selesai
  │     └── debt: masuk debt_ledger
  │
  ├─▶ [Jika ada] Debt Collection (kumpul bayaran hutang)
  │
  ├─▶ Stock Return (rekod stok tak terjual, petang)
  │
  └─▶ Daily Closing (rekonsiliasi, akhir hari)
```

### 7.2 Aliran Pengurusan (Admin)

```
Login
  │
  ├─▶ Dashboard (overview bisnes)
  │
  ├─▶ Urus Kawasan / Pelanggan / Pembekal
  │
  ├─▶ Assign Kakitangan ke Kawasan
  │
  ├─▶ Semak Laporan (harian/mingguan)
  │
  ├─▶ Settle Pembekal (tandakan settlement)
  │
  ├─▶ Reconcile Daily Closing (sahkan penutupan)
  │
  └─▶ Semak Audit Log (jika ada isu)
```

---

## 8. Model Data (Ringkasan)

```
suppliers ──────▶ stock_intake ──────▶ stock_distribution ──▶ areas
                      │                        │
                      ▼                        ▼
            supplier_settlements         stock_return
                                               │
areas ──▶ customers ──▶ sales ──────────────▶─┘
                         │
                         ├── payment_type=cash
                         └── payment_type=debt ──▶ debt_ledger
                                                        │
                                                   debt_collection

expenses ──▶ daily_closings (per area, per date)

all financial tables ──▶ audit_logs (via DB triggers)
```

---

## 9. Kriteria Penerimaan (Acceptance Criteria)

### Sprint / Phase 1 (Foundation) ✅
- [x] PWA boleh dipasang dan berfungsi offline
- [x] Auth berfungsi (login, daftar, log keluar)
- [x] Offline detector dan sync engine berfungsi

### Sprint / Phase 2 (Core Domain) ✅
- [x] CRUD penuh untuk Areas, Customers, Suppliers, Staff
- [x] RLS policies dikonfigurasi dengan betul

### Sprint / Phase 3 (Stock) ✅
- [x] Stock intake → distribution → return cycle berfungsi
- [x] Validasi kuantiti dikuatkuasakan

### Sprint / Phase 4 (Sales & Debt) ✅
- [x] Jualan tunai dan hutang berfungsi
- [x] Debt ledger append-only dikuatkuasakan
- [x] Kutipan hutang berfungsi

### Sprint / Phase 5 (Expenses & Reports) ✅
- [x] Pengurusan perbelanjaan berfungsi
- [x] Laporan dengan carta berfungsi
- [x] Export PDF berfungsi

### Sprint / Phase 6 (Closing & Deployment) ✅
- [x] Daily closing state machine berfungsi
- [x] Validasi penutupan dikuatkuasakan
- [x] Audit log berfungsi

### Belum Selesai (Pending)
- [ ] Demo seed data
- [ ] Production deployment
- [ ] PWA icons (192, 512, maskable)

---

## 10. Risiko & Mitigasi

| Risiko | Kemungkinan | Impak | Mitigasi |
|--------|-------------|-------|---------|
| Data loss semasa offline | Sederhana | Tinggi | IndexedDB + sync queue dengan retry |
| Sync conflict (data bertindih) | Rendah | Tinggi | Append-only untuk jadual kewangan |
| RLS misconfiguration | Rendah | Kritikal | Test dengan kedua-dua role sebelum deploy |
| Supabase downtime | Rendah | Sederhana | Offline mode mengekalkan operasi |
| Kesalahan pengiraan hutang | Rendah | Tinggi | RPC recalculate_customer_balance() untuk semak semula |

---

## 11. Metrik Kejayaan

| Metrik | Sasaran |
|--------|---------|
| Masa muat halaman utama | < 2 saat |
| Uptime sistem | > 99.5% |
| Ketepatan pengiraan hutang | 100% (verified dari ledger) |
| Kadar kejayaan sync offline | > 98% (selepas 5 retry) |
| Masa onboarding pengguna baru | < 10 minit (dengan guided tour) |

---

## 12. Glosari

| Istilah | Maksud |
|---------|--------|
| **Pax** | Unit ukuran ais (satu pax = satu unit ais) |
| **Intake** | Pengambilan stok dari pembekal |
| **Distribution** | Pengagihan stok ke kawasan penghantaran |
| **Settlement** | Penyelesaian pembayaran kepada pembekal |
| **Closing** | Penutupan operasi harian untuk satu kawasan |
| **Reconciliation** | Pengesahan dan penyesuaian data oleh admin |
| **Ledger** | Buku rekod pergerakan kewangan (hutang) |
| **RLS** | Row Level Security — kawalan akses peringkat baris dalam PostgreSQL |
| **PWA** | Progressive Web App — aplikasi web yang boleh dipasang seperti aplikasi native |
| **RPC** | Remote Procedure Call — fungsi custom yang dipanggil melalui Supabase |

---

*PRD ini mencerminkan keperluan dan status semasa Pokleh Enterprise v1.0.0 (Jun 2026).*
