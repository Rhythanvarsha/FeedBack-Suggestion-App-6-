package com.feedback.service;

import com.feedback.dto.FeedbackDTO;
import com.feedback.entity.Feedback;
import com.feedback.entity.User;
import com.feedback.exception.BadRequestException;
import com.feedback.exception.FeedbackNotFoundException;
import com.feedback.exception.ForbiddenOperationException;
import com.feedback.exception.UserNotFoundException;
import com.feedback.repository.FeedbackRepository;
import com.feedback.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FeedbackService {

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    public Feedback submitFeedback(String title, String description, String category, Integer rating,
                                   String username, Long userId) {
        if (title == null || title.trim().isEmpty()) {
            throw new BadRequestException("Title is required");
        }
        if (description == null || description.trim().isEmpty()) {
            throw new BadRequestException("Description is required");
        }
        if (category == null || category.trim().isEmpty()) {
            throw new BadRequestException("Category is required");
        }
        if (rating == null) {
            throw new BadRequestException("Rating is required");
        }
        if (rating < 1 || rating > 5) {
            throw new BadRequestException("Rating must be between 1 and 5");
        }
        if (username == null || username.trim().isEmpty()) {
            throw new BadRequestException("Username is required");
        }
        if (userId == null) {
            throw new UserNotFoundException("User id cannot be null");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        Feedback feedback = new Feedback(title.trim(), description.trim(), category.trim(), rating, username.trim(), user);
        Feedback saved = feedbackRepository.save(feedback);
        notificationService.notifyAdminsNewFeedback(saved);
        return saved;
    }

    public Feedback updateFeedback(Long id, String title, String description, String category, Integer rating) {
        if (id == null) {
            throw new FeedbackNotFoundException("Feedback id cannot be null");
        }
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new FeedbackNotFoundException("Feedback not found"));

        if (title != null) feedback.setTitle(title);
        if (description != null) feedback.setDescription(description);
        if (category != null) feedback.setCategory(category);
        if (rating != null) {
            if (rating < 1 || rating > 5) {
                throw new BadRequestException("Rating must be between 1 and 5");
            }
            feedback.setRating(rating);
        }
        feedback.setUpdatedDate(LocalDateTime.now());

        return feedbackRepository.save(feedback);
    }

    public Feedback updateMyFeedback(String ownerEmail, Long id, String title, String description, String category, Integer rating) {
        if (ownerEmail == null || ownerEmail.trim().isEmpty()) {
            throw new UserNotFoundException("User email cannot be null");
        }
        if (id == null) {
            throw new FeedbackNotFoundException("Feedback id cannot be null");
        }
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new FeedbackNotFoundException("Feedback not found"));

        if (feedback.getUser() == null || feedback.getUser().getEmail() == null) {
            throw new ForbiddenOperationException("You are not allowed to edit this feedback");
        }
        if (!ownerEmail.equalsIgnoreCase(feedback.getUser().getEmail())) {
            throw new ForbiddenOperationException("You are not allowed to edit this feedback");
        }

        // Optional business rule: allow edits only while Pending
        if (feedback.getStatus() != null && !"Pending".equalsIgnoreCase(feedback.getStatus())) {
            throw new ForbiddenOperationException("Feedback can be edited only while status is Pending");
        }

        return updateFeedback(id, title, description, category, rating);
    }

    public Feedback updateFeedbackStatus(Long id, String status) {
        if (id == null) {
            throw new FeedbackNotFoundException("Feedback id cannot be null");
        }
        validateStatus(status);
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new FeedbackNotFoundException("Feedback not found"));
        feedback.setStatus(status);
        feedback.setUpdatedDate(LocalDateTime.now());
        return feedbackRepository.save(feedback);
    }

    public Feedback addReplyToFeedback(Long id, String reply) {
        if (id == null) {
            throw new FeedbackNotFoundException("Feedback id cannot be null");
        }
        if (reply != null && reply.length() > 5000) {
            throw new BadRequestException("Reply is too long");
        }
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new FeedbackNotFoundException("Feedback not found"));
        feedback.setReply(reply);
        feedback.setUpdatedDate(LocalDateTime.now());
        return feedbackRepository.save(feedback);
    }

    public Feedback getFeedbackById(Long id) {
        if (id == null) {
            throw new FeedbackNotFoundException("Feedback id cannot be null");
        }
        return feedbackRepository.findById(id)
                .orElseThrow(() -> new FeedbackNotFoundException("Feedback not found"));
    }

    public List<FeedbackDTO> getFeedbackByUsername(String username) {
        return feedbackRepository.findByUsername(username).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Page<FeedbackDTO> getFeedbackByUsername(String username, Pageable pageable) {
        return feedbackRepository.findByUsername(username, pageable)
                .map(this::convertToDTO);
    }

    public Page<FeedbackDTO> getFeedbackByCategory(String category, Pageable pageable) {
        return feedbackRepository.findByCategory(category, pageable)
                .map(this::convertToDTO);
    }

    public Page<FeedbackDTO> getFeedbackByStatus(String status, Pageable pageable) {
        return feedbackRepository.findByStatus(status, pageable)
                .map(this::convertToDTO);
    }

    public Page<FeedbackDTO> getFeedbackByStatusAndCategory(String status, String category, Pageable pageable) {
        return feedbackRepository.findByCategoryAndStatus(category, status, pageable)
                .map(this::convertToDTO);
    }

    public Page<FeedbackDTO> searchFeedbackByTitle(String title, Pageable pageable) {
        return feedbackRepository.findByTitleContainingIgnoreCase(title, pageable)
                .map(this::convertToDTO);
    }

    public Page<FeedbackDTO> searchFeedbackByTitleAndCategory(String title, String category, Pageable pageable) {
        return feedbackRepository.findByCategoryAndTitleContainingIgnoreCase(category, title, pageable)
                .map(this::convertToDTO);
    }

    public Page<FeedbackDTO> searchMyFeedbackByTitle(String username, String title, Pageable pageable) {
        return feedbackRepository.findByUsernameAndTitleContainingIgnoreCase(username, title, pageable)
                .map(this::convertToDTO);
    }

    public Page<FeedbackDTO> getAllFeedback(Pageable pageable) {
        if (pageable == null) {
            pageable = PageRequest.of(0, 10);
        }
        return feedbackRepository.findAll(pageable)
                .map(this::convertToDTO);
    }

    public Page<FeedbackDTO> getAllFeedbackByCategory(String category, Pageable pageable) {
        if (category == null || category.trim().isEmpty()) {
            throw new ForbiddenOperationException("Admin category is not set");
        }
        if (pageable == null) {
            pageable = PageRequest.of(0, 10);
        }
        return feedbackRepository.findByCategory(category, pageable)
                .map(this::convertToDTO);
    }

    public List<Feedback> getFeedbackForExport(String category, String status, String title) {
        if (category == null || category.trim().isEmpty()) {
            throw new ForbiddenOperationException("Admin category is not set");
        }

        String statusNorm = status != null ? status.trim() : null;
        String titleNorm = title != null ? title.trim() : null;

        if (titleNorm != null && !titleNorm.isEmpty()) {
            return feedbackRepository.findByCategoryAndTitleContainingIgnoreCaseOrderByCreatedDateDesc(category, titleNorm);
        }
        if (statusNorm != null && !statusNorm.isEmpty() && !"all".equalsIgnoreCase(statusNorm)) {
            return feedbackRepository.findByCategoryAndStatusOrderByCreatedDateDesc(category, statusNorm);
        }
        return feedbackRepository.findByCategoryOrderByCreatedDateDesc(category);
    }

    public byte[] exportFeedbackCsv(String category, String status, String title) {
        List<Feedback> list = getFeedbackForExport(category, status, title);
        String csv = toCsv(list);
        return csv.getBytes(StandardCharsets.UTF_8);
    }

    private String toCsv(List<Feedback> list) {
        if (list == null) list = new ArrayList<>();

        StringBuilder sb = new StringBuilder();
        sb.append("Id,Title,Description,Category,Rating,Status,Username,Reply,CreatedDate,UpdatedDate\n");
        for (Feedback f : list) {
            sb.append(csv(f.getId()));
            sb.append(',').append(csv(f.getTitle()));
            sb.append(',').append(csv(f.getDescription()));
            sb.append(',').append(csv(f.getCategory()));
            sb.append(',').append(csv(f.getRating()));
            sb.append(',').append(csv(f.getStatus()));
            sb.append(',').append(csv(f.getUsername()));
            sb.append(',').append(csv(f.getReply()));
            sb.append(',').append(csv(f.getCreatedDate()));
            sb.append(',').append(csv(f.getUpdatedDate()));
            sb.append('\n');
        }
        return sb.toString();
    }

    private String csv(Object value) {
        String s = value == null ? "" : String.valueOf(value);
        // Always quote; escape quotes inside values.
        s = s.replace("\"", "\"\"");
        return "\"" + s + "\"";
    }

    public Feedback updateFeedbackStatusForAdminCategory(Long id, String status, String adminCategory) {
        Feedback feedback = getFeedbackById(id);
        ensureAdminCategoryAccess(adminCategory, feedback);
        return updateFeedbackStatus(id, status);
    }

    @Transactional
    public List<Feedback> bulkUpdateFeedbackStatusForAdminCategory(List<Long> ids, String status, String adminCategory) {
        if (ids == null || ids.isEmpty()) {
            throw new BadRequestException("Ids are required");
        }
        validateStatus(status);

        // Keep the status value consistent as provided (trim only).
        String newStatus = status.trim();

        List<Feedback> toSave = new ArrayList<>();
        for (Long id : ids) {
            if (id == null) continue;
            Feedback feedback = getFeedbackById(id);
            ensureAdminCategoryAccess(adminCategory, feedback);
            feedback.setStatus(newStatus);
            feedback.setUpdatedDate(LocalDateTime.now());
            toSave.add(feedback);
        }

        if (toSave.isEmpty()) {
            throw new BadRequestException("No valid ids provided");
        }

        return feedbackRepository.saveAll(toSave);
    }

    public Feedback addReplyToFeedbackForAdminCategory(Long id, String reply, String adminCategory) {
        Feedback feedback = getFeedbackById(id);
        ensureAdminCategoryAccess(adminCategory, feedback);
        return addReplyToFeedback(id, reply);
    }

    public void deleteFeedbackForAdminCategory(Long id, String adminCategory) {
        Feedback feedback = getFeedbackById(id);
        ensureAdminCategoryAccess(adminCategory, feedback);
        deleteFeedback(id);
    }

    public void deleteFeedback(Long id) {
        if (id == null) {
            throw new FeedbackNotFoundException("Feedback id cannot be null");
        }
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new FeedbackNotFoundException("Feedback not found"));
        if (feedback != null) {
            feedbackRepository.delete(feedback);
        }
    }

    public long getTotalFeedback() {
        return feedbackRepository.count();
    }

    public long getTotalFeedbackByCategory(String category) {
        return feedbackRepository.countByCategory(category);
    }

    public long getPendingFeedbackCount() {
        return feedbackRepository.countByStatus("Pending");
    }

    public long getPendingFeedbackCountByCategory(String category) {
        return feedbackRepository.countByCategoryAndStatus(category, "Pending");
    }

    public long getResolvedFeedbackCount() {
        return feedbackRepository.countByStatus("Resolved");
    }

    public long getResolvedFeedbackCountByCategory(String category) {
        return feedbackRepository.countByCategoryAndStatus(category, "Resolved");
    }

    public long getReviewedFeedbackCount() {
        return feedbackRepository.countByStatus("Reviewed");
    }

    public long getReviewedFeedbackCountByCategory(String category) {
        return feedbackRepository.countByCategoryAndStatus(category, "Reviewed");
    }

    private void ensureAdminCategoryAccess(String adminCategory, Feedback feedback) {
        if (adminCategory == null || adminCategory.trim().isEmpty()) {
            throw new ForbiddenOperationException("Admin category is not set");
        }
        if (feedback == null || feedback.getCategory() == null) {
            throw new ForbiddenOperationException("Feedback category is missing");
        }
        if (!adminCategory.equalsIgnoreCase(feedback.getCategory())) {
            throw new ForbiddenOperationException("You can access feedback only for your category: " + adminCategory);
        }
    }

    private void validateStatus(String status) {
        if (status == null || status.trim().isEmpty()) {
            throw new BadRequestException("Status is required");
        }
        String s = status.trim();
        if (!"Pending".equalsIgnoreCase(s) && !"Reviewed".equalsIgnoreCase(s) && !"Resolved".equalsIgnoreCase(s)) {
            throw new BadRequestException("Invalid status: " + status);
        }
    }

    public long getUserTotalFeedback(Long userId) {
        return feedbackRepository.countByUserId(userId);
    }

    public long getUserPendingFeedbackCount(Long userId) {
        return feedbackRepository.countByUserIdAndStatus(userId, "Pending");
    }

    public long getUserResolvedFeedbackCount(Long userId) {
        return feedbackRepository.countByUserIdAndStatus(userId, "Resolved");
    }

    public long getUserReviewedFeedbackCount(Long userId) {
        return feedbackRepository.countByUserIdAndStatus(userId, "Reviewed");
    }

    private FeedbackDTO convertToDTO(Feedback feedback) {
        return new FeedbackDTO(
                feedback.getId(),
                feedback.getTitle(),
                feedback.getDescription(),
                feedback.getCategory(),
                feedback.getRating(),
                feedback.getStatus(),
                feedback.getUsername(),
                feedback.getReply(),
                feedback.getCreatedDate(),
                feedback.getUpdatedDate()
        );
    }
}
