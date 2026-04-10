package com.feedback.repository;

import com.feedback.entity.Feedback;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByUsername(String username);
    List<Feedback> findByCategory(String category);
    List<Feedback> findByStatus(String status);
    List<Feedback> findByTitleContainingIgnoreCase(String title);
    Page<Feedback> findByUsername(String username, Pageable pageable);
    Page<Feedback> findByCategory(String category, Pageable pageable);
    Page<Feedback> findByStatus(String status, Pageable pageable);
    Page<Feedback> findByTitleContainingIgnoreCase(String title, Pageable pageable);
    Page<Feedback> findByUsernameAndTitleContainingIgnoreCase(String username, String title, Pageable pageable);

    // Admin category scoping
    Page<Feedback> findByCategoryAndStatus(String category, String status, Pageable pageable);
    Page<Feedback> findByCategoryAndTitleContainingIgnoreCase(String category, String title, Pageable pageable);
    List<Feedback> findByCategoryOrderByCreatedDateDesc(String category);
    List<Feedback> findByCategoryAndStatusOrderByCreatedDateDesc(String category, String status);
    List<Feedback> findByCategoryAndTitleContainingIgnoreCaseOrderByCreatedDateDesc(String category, String title);

    long countByStatus(String status);
    long countByUserIdAndStatus(Long userId, String status);
    long countByUserId(Long userId);

    long countByCategory(String category);
    long countByCategoryAndStatus(String category, String status);
}
