package com.squarefeetx.property.repository;

import com.squarefeetx.property.model.Property;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface PropertyRepository extends MongoRepository<Property, String> {
    List<Property> findByStatus(String status);
    List<Property> findBySellerId(String sellerId);
    List<Property> findByStatusIn(List<String> statuses);
    List<Property> findByStatusAndLocationCityIn(String status, List<String> cities);
    List<Property> findByStatusInAndLocationCityIn(List<String> statuses, List<String> cities);
}
