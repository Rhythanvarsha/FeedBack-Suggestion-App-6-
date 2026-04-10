package com.feedback.service;

import com.feedback.dto.NotificationDTO;
import com.feedback.entity.Feedback;
import com.feedback.entity.Notification;
import com.feedback.entity.User;
import com.feedback.exception.NotificationNotFoundException;
import com.feedback.exception.UserNotFoundException;
import com.feedback.repository.NotificationRepository;
import com.feedback.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    public void notifyAdminsNewFeedback(Feedback feedback) {
        if (feedback == null || feedback.getCategory() == null || feedback.getCategory().trim().isEmpty()) {
            return;
        }

        // Only notify admins responsible for this feedback category.
        List<User> admins = userRepository.findAllByRoleAndCategory("ADMIN", feedback.getCategory());
        if (admins == null || admins.isEmpty()) {
            return;
        }

        String message = "New feedback submitted by " + feedback.getUsername() + ": " + feedback.getTitle();
        List<Notification> notifications = admins.stream()
                .map(admin -> new Notification(admin, "NEW_FEEDBACK", message, feedback.getId()))
                .collect(Collectors.toList());
        notificationRepository.saveAll(notifications);
    }

    public void notifyFeedbackOwnerStatusChanged(Feedback feedback, String newStatus) {
        User recipient = feedback.getUser();
        if (recipient == null) {
            return;
        }
        String message = "Your feedback \"" + feedback.getTitle() + "\" status changed to: " + newStatus;
        notificationRepository.save(new Notification(recipient, "FEEDBACK_STATUS_CHANGED", message, feedback.getId()));
    }

    public void notifyFeedbackOwnerReplied(Feedback feedback) {
        User recipient = feedback.getUser();
        if (recipient == null) {
            return;
        }
        String message = "Admin replied to your feedback: \"" + feedback.getTitle() + "\"";
        notificationRepository.save(new Notification(recipient, "FEEDBACK_REPLIED", message, feedback.getId()));
    }

    public List<NotificationDTO> getMyNotifications(int limit) {
        User user = getCurrentUser();
        List<Notification> notifications = notificationRepository.findTop50ByRecipientIdOrderByCreatedAtDesc(user.getId());
        if (limit <= 0 || limit > notifications.size()) {
            limit = notifications.size();
        }
        return notifications.subList(0, limit).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public long getMyUnreadCount() {
        User user = getCurrentUser();
        return notificationRepository.countByRecipientIdAndReadFalse(user.getId());
    }

    @Transactional
    public void markRead(Long notificationId) {
        User user = getCurrentUser();
        Notification notification = notificationRepository.findByIdAndRecipientId(notificationId, user.getId())
                .orElseThrow(() -> new NotificationNotFoundException("Notification not found"));
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public int markAllRead() {
        User user = getCurrentUser();
        return notificationRepository.markAllRead(user.getId());
    }

    private NotificationDTO toDto(Notification notification) {
        return new NotificationDTO(
                notification.getId(),
                notification.getType(),
                notification.getMessage(),
                notification.isRead(),
                notification.getCreatedAt(),
                notification.getFeedbackId()
        );
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + email));
    }
}
