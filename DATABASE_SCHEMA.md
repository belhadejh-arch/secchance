# مخطط قاعدة البيانات الشامل — DATABASE_SCHEMA.md

## الجداول والعلاقات الأساسية (Database Schema & ERD)

```
[users] 1──* [case_files] (as patient/creator)
[users] 1──* [case_assignments] (as specialist)
[users] 1──* [specialist_profiles]
[users] 1──* [notifications]
[users] 1──* [audit_logs]

[case_files] 1──* [case_notes]
[case_files] 1──* [case_assignments]
[case_files] 1──* [assessments]
[case_files] 1──* [treatment_plans]
[case_files] 1──* [therapy_sessions]
[case_files] 1──* [case_progress]
[case_files] 1──* [case_documents]
[case_files] 1──1 [conversations] 1──* [messages]
[case_files] 1──* [appointments]
[case_files] 1──* [legal_consultations]
[case_files] 1──* [treatment_follow_ups]
[case_files] 1──* [ratings]

[wilayas] 1──* [communes]
[wilayas] 1──* [users]
[wilayas] 1──* [centers]
[wilayas] 1──* [associations]
```

### تفاصيل الجداول:
1. **users**: `id`, `first_name`, `last_name`, `email`, `phone`, `password`, `role_id`, `role_slug`, `wilaya_id`, `commune_id`, `is_verified`, `status` ('active', 'pending_approval', 'suspended'), `last_login_at`, `created_at`, `updated_at`.
2. **roles**: `id`, `name`, `slug` ('guest', 'family', 'patient', 'psychologist', 'lawyer', 'treatment_center', 'association', 'admin'), `created_at`, `updated_at`.
3. **permissions**: `id`, `name`, `slug`, `created_at`.
4. **role_has_permissions**: `role_id`, `permission_id`.
5. **wilayas**: `id`, `name_ar`, `name_fr`, `code` (58 wilayas of Algeria).
6. **communes**: `id`, `wilaya_id`, `name`.
7. **specialist_profiles**: `id`, `user_id`, `specialty`, `license_number`, `years_of_experience`, `bio`, `verification_status` ('pending', 'approved', 'rejected'), `availability_schedule`, `created_at`.
8. **centers**: `id`, `user_id`, `name`, `wilaya_id`, `address`, `phone`, `services`, `capacity`, `current_occupancy`, `verification_status`, `created_at`.
9. **associations**: `id`, `user_id`, `name`, `wilaya_id`, `address`, `phone`, `services`, `verification_status`, `created_at`.
10. **addiction_types**: `id`, `name_ar`, `name_en`, `description`, `is_active`, `created_at`.
11. **case_files**: `id`, `number_case` (e.g. SCP-2026-00123), `created_by`, `patient_id`, `assigned_psychologist_id`, `assigned_lawyer_id`, `treatment_center_id`, `addiction_type_id`, `priority` ('Critical', 'High', 'Medium', 'Low'), `status` ('NEW', 'UNDER_REVIEW', 'ASSIGNED', 'FIRST_SESSION', 'FOLLOW_UP', 'REFERRED', 'COMPLETED', 'ARCHIVED'), `description`, `target_response_hours`, `created_at`, `updated_at`.
12. **case_notes**: `id`, `case_file_id`, `user_id`, `note`, `is_private`, `created_at`.
13. **case_assignments**: `id`, `case_file_id`, `specialist_id`, `assigned_by`, `role_type`, `status` ('pending', 'accepted', 'rejected'), `notes`, `created_at`.
14. **assessments**: `id`, `case_file_id`, `psychologist_id`, `severity` ('Mild', 'Moderate', 'Severe', 'Extreme'), `recommendation`, `mental_health_notes`, `created_at`.
15. **treatment_plans**: `id`, `case_file_id`, `goal`, `strategy`, `duration`, `sessions_count`, `final_evaluation`, `created_at`.
16. **therapy_sessions**: `id`, `case_file_id`, `session_number`, `date`, `duration`, `notes`, `session_next`, `status` ('SCHEDULED', 'COMPLETED', 'CANCELLED'), `created_at`.
17. **case_progress**: `id`, `case_file_id`, `progress_percentage` (0, 10, 25, 50, 75, 100), `notes`, `updated_by`, `created_at`.
18. **case_documents**: `id`, `case_file_id`, `uploaded_by`, `file_name`, `file_type`, `file_size`, `storage_path`, `visibility` ('all', 'medical_only', 'legal_only', 'admin_only'), `created_at`.
19. **conversations**: `id`, `case_file_id`, `title`, `created_at`.
20. **conversation_participants**: `id`, `conversation_id`, `user_id`, `joined_at`.
21. **messages**: `id`, `conversation_id`, `sender_id`, `content`, `attachment_url`, `created_at`.
22. **message_read_statuses**: `id`, `message_id`, `user_id`, `read_at`.
23. **appointments**: `id`, `case_file_id`, `created_by`, `specialist_id`, `appointment_date`, `start_time`, `end_time`, `type` ('psychological', 'legal', 'treatment', 'referral'), `status` ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'), `notes`, `cancellation_reason`, `created_at`.
24. **legal_consultations**: `id`, `case_file_id`, `lawyer_id`, `status` ('PENDING', 'ACCEPTED', 'IN_REVIEW', 'COMPLETED', 'REJECTED'), `legal_opinion`, `recommendation`, `rejection_reason`, `created_at`.
25. **treatment_follow_ups**: `id`, `case_file_id`, `center_id`, `week_number`, `medical_notes`, `status_summary`, `created_at`.
26. **ratings**: `id`, `case_file_id`, `user_id`, `rating`, `feedback`, `created_at`.
27. **notifications**: `id`, `user_id`, `title`, `message`, `type`, `link`, `is_read`, `created_at`.
28. **audit_logs**: `id`, `user_id`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`.
29. **emergency_resources**: `id`, `title_ar`, `phone_number`, `description_ar`, `is_24_7`.
