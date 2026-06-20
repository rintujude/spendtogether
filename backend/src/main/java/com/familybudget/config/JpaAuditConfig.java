package com.familybudget.config;

import com.familybudget.service.CurrentUserService;
import java.util.Optional;
import java.util.UUID;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration
@EnableJpaAuditing
public class JpaAuditConfig {

    @Bean
    public AuditorAware<UUID> auditorAware(CurrentUserService currentUserService) {
        return () -> Optional.ofNullable(currentUserService.getCurrentUserIdOrNull());
    }
}
