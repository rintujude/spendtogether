package com.familybudget.audit;

import static org.assertj.core.api.Assertions.assertThat;

import com.familybudget.auth.AuthenticatedUser;
import com.familybudget.auth.JwtService;
import com.familybudget.entity.AuditableEntity;
import com.familybudget.entity.BudgetCategory;
import com.familybudget.entity.Expense;
import com.familybudget.entity.MonthlyBudget;
import com.familybudget.entity.Notification;
import com.familybudget.entity.PaymentSource;
import com.familybudget.entity.User;
import com.familybudget.entity.Workspace;
import com.familybudget.entity.WorkspaceInvitation;
import com.familybudget.entity.WorkspaceMonthlyTotalBudget;
import com.familybudget.entity.WorkspaceMember;
import com.familybudget.service.CurrentUserService;
import com.familybudget.service.SoftDeleteService;
import java.lang.reflect.Field;
import java.util.List;
import java.util.UUID;
import org.hibernate.annotations.SQLRestriction;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

class AuditArchitectureTest {

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void jwtContainsUserIdAndCanExtractIt() throws Exception {
        UUID userId = UUID.randomUUID();
        User user = new User();
        setEntityId(user, userId);
        user.setEmail("user@example.com");

        JwtService jwtService = new JwtService("01234567890123456789012345678901", 60);
        String token = jwtService.createToken(user);

        assertThat(jwtService.extractSubject(token)).isEqualTo("user@example.com");
        assertThat(jwtService.extractUserId(token)).isEqualTo(userId);
    }

    @Test
    void currentUserServiceReadsAuthenticatedUserIdFromSecurityContext() {
        UUID userId = UUID.randomUUID();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        new AuthenticatedUser(userId, "user@example.com"),
                        null,
                        List.of()
                )
        );

        assertThat(new CurrentUserService().getCurrentUserId()).isEqualTo(userId);
    }

    @Test
    void softDeleteSetsDeletedAuditFieldsAndIsIdempotent() {
        UUID userId = UUID.randomUUID();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        new AuthenticatedUser(userId, "user@example.com"),
                        null,
                        List.of()
                )
        );

        BudgetCategory category = new BudgetCategory();
        SoftDeleteService softDeleteService = new SoftDeleteService(new CurrentUserService());
        softDeleteService.softDelete(category);
        var deletedAt = category.getDeletedAt();

        softDeleteService.softDelete(category);

        assertThat(category.getDeletedAt()).isEqualTo(deletedAt);
        assertThat(category.getDeletedBy()).isEqualTo(userId);
    }

    @Test
    void auditableEntityDefinesCreateAndUpdateAuditAnnotations() throws Exception {
        assertThat(AuditableEntity.class.getDeclaredField("createdAt").isAnnotationPresent(CreatedDate.class)).isTrue();
        assertThat(AuditableEntity.class.getDeclaredField("updatedAt").isAnnotationPresent(LastModifiedDate.class)).isTrue();
        assertThat(AuditableEntity.class.getDeclaredField("createdBy").isAnnotationPresent(CreatedBy.class)).isTrue();
        assertThat(AuditableEntity.class.getDeclaredField("updatedBy").isAnnotationPresent(LastModifiedBy.class)).isTrue();
    }

    @Test
    void auditableEntityDefinesSoftDeleteAndVersionFields() throws Exception {
        assertThat(AuditableEntity.class.getDeclaredField("deletedAt")).isNotNull();
        assertThat(AuditableEntity.class.getDeclaredField("deletedBy")).isNotNull();
        assertThat(AuditableEntity.class.getDeclaredField("version")).isNotNull();
    }

    @Test
    void mainEntitiesUseHibernateSoftDeleteRestriction() {
        List<Class<?>> entities = List.of(
                User.class,
                Workspace.class,
                WorkspaceMember.class,
                WorkspaceInvitation.class,
                Notification.class,
                BudgetCategory.class,
                PaymentSource.class,
                MonthlyBudget.class,
                WorkspaceMonthlyTotalBudget.class,
                Expense.class
        );

        assertThat(entities)
                .allSatisfy(entity -> assertThat(entity.getAnnotation(SQLRestriction.class).value())
                        .isEqualTo("deleted_at IS NULL"));
    }

    private static void setEntityId(AuditableEntity entity, UUID id) throws Exception {
        Field idField = AuditableEntity.class.getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(entity, id);
    }
}
