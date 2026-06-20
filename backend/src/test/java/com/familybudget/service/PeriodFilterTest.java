package com.familybudget.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class PeriodFilterTest {

    @Test
    void monthPeriodResolvesStartAndEndDates() {
        PeriodFilter period = PeriodFilter.from("MONTH", 6, 2026, null, null, null);

        assertThat(period.periodType()).isEqualTo(PeriodFilter.PeriodType.MONTH);
        assertThat(period.startDate()).isEqualTo(LocalDate.of(2026, 6, 1));
        assertThat(period.endDate()).isEqualTo(LocalDate.of(2026, 6, 30));
    }

    @Test
    void dayPeriodUsesSingleDate() {
        PeriodFilter period = PeriodFilter.from("DAY", null, null, null, null, LocalDate.of(2026, 6, 16));

        assertThat(period.startDate()).isEqualTo(LocalDate.of(2026, 6, 16));
        assertThat(period.endDate()).isEqualTo(LocalDate.of(2026, 6, 16));
    }

    @Test
    void customRangeRejectsInvalidDateOrder() {
        assertThatThrownBy(() -> PeriodFilter.from(
                "CUSTOM_RANGE",
                null,
                null,
                LocalDate.of(2026, 6, 30),
                LocalDate.of(2026, 6, 1),
                null
        )).isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void customPresetUsesProvidedDateRange() {
        PeriodFilter period = PeriodFilter.fromPreset(
                "CUSTOM",
                LocalDate.of(2026, 6, 1),
                LocalDate.of(2026, 6, 15)
        );

        assertThat(period.periodType()).isEqualTo(PeriodFilter.PeriodType.CUSTOM_RANGE);
        assertThat(period.startDate()).isEqualTo(LocalDate.of(2026, 6, 1));
        assertThat(period.endDate()).isEqualTo(LocalDate.of(2026, 6, 15));
    }
}
