package com.squarefeetx.property.repository;

import com.squarefeetx.property.model.SavedProperty;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface SavedPropertyRepository extends MongoRepository<SavedProperty, String> {
    List<SavedProperty> findByUserId(String userId);
    Optional<SavedProperty> findByUserIdAndPropertyId(String userId, String propertyId);
    void deleteByUserIdAndPropertyId(String userId, String propertyId);
    long countByUserId(String userId);
}
