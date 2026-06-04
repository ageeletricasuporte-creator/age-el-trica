# Security Specification & Threat Model - AGE Elétrica

## 1. Data Invariants
- `Usuario` can only be read or written by authenticated users.
- `ConfiguracaoEmpresa` can be read by anyone (public site matches logo, title, phone, banner), but only modified by administrators.
- `SolicitacaoPublica` (public request) can be created by anyone anonymously (from the public landing page form), but only read/updated by authenticated staff (Administrador, Atendente, Tecnico).
- `Cliente`, `Servico`, `Orcamento`, `ItemOrcamento`, `Recibo`, `Pagamento`, and `Atendimento` can only be read/written by authenticated system users.

## 2. Insecurity Payload Threat Matrix ("Dirty Dozen")
1. **Unauthenticated Configuration Hijack**: Anonymous user attempts to update company's Pix key or contact info.
2. **Logo Injection Over-sizing**: A user attempts to upload a 20MB raw base64 string directly into config.logo.
3. **Budget Status Escalation**: A technician attempts to mark an unauthorized budget as `Finalizado` bypassing proper workflow validations.
4. **Receipt Spurious Creation**: Creating a receipt for a non-existent budget or client to spoof proof of delivery.
5. **PII Data Scraping**: An unauthenticated user attempts to list all registered customers or view details of another customer.
6. **Solicitation Status Modification**: An anonymous outside user attempts to advance their request status from "Novo" to "Finalizado" without permission.
7. **Identity Theft Draft**: Setting the author or representative of an invoice or budget to another user ID.
8. **Negative Cost Item injection**: Submitting a budget item quantity of `-5` with positive unit price to artificially reduce the budget total.
9. **Budget Backdating**: Forcing the `createdAt` timestamp of a budget into the past instead of current server time.
10. **System User privilege escalation**: A non-admin user trying to modify their own `nivelAcesso` to 'Administrador'.
11. **Malicious ID Poisoning**: Trying to create a customer with document ID like `<script>alert(1)</script>` or super-long strings.
12. **Recursive Cost Denials**: Rapidly requesting expensive relational reads on deep subcollections to exhaust database daily query quotas.

## 3. Secure Verification Rules Summary
Rules are declared inside `firestore.rules` and enforced directly database-side. All test scenarios reject invalid inputs.
