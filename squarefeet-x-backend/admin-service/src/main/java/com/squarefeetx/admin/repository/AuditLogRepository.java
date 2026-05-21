package com.squarefeetx.admin.repository;

import com.squarefeetx.admin.model.AuditLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface AuditLogRepository extends MongoRepository<AuditLog, String> {
    List<AuditLog> findAllByOrderByCreatedAtDesc();
}
