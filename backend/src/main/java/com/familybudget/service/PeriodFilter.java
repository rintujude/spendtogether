package com.familybudget.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public record PeriodFilter(
        PeriodType periodType,
        Integer month,
        Integer year,
        LocalDate startDate,
        LocalDate endDate
) {
    public enum PeriodType {
        MONTH,
        WEEK,
        DAY,
        CUSTOM_RANGE
    }

    public enum PeriodPreset {
        TODAY,
        THIS_WEEK,
        THIS_MONTH,
        LAST_MONTH,
        CUSTOM
    }

    public static PeriodFilter fromPreset(String periodPresetText, LocalDate startDate, LocalDate endDate) {
        PeriodPreset preset = parsePeriodPreset(periodPresetText);
        LocalDate today = LocalDate.now();

        return switch (preset) {
            case TODAY -> new PeriodFilter(PeriodType.DAY, today.getMonthValue(), today.getYear(), today, today);
            case THIS_WEEK -> {
                LocalDate start = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                yield new PeriodFilter(PeriodType.WEEK, start.getMonthValue(), start.getYear(), start, start.plusDays(6));
            }
            case THIS_MONTH -> {
                LocalDate start = LocalDate.of(today.getYear(), today.getMonthValue(), 1);
                yield new PeriodFilter(PeriodType.MONTH, today.getMonthValue(), today.getYear(), start, start.withDayOfMonth(start.lengthOfMonth()));
            }
            case LAST_MONTH -> {
                LocalDate start = LocalDate.of(today.getYear(), today.getMonthValue(), 1).minusMonths(1);
                yield new PeriodFilter(PeriodType.MONTH, start.getMonthValue(), start.getYear(), start, start.withDayOfMonth(start.lengthOfMonth()));
            }
            case CUSTOM -> from("CUSTOM_RANGE", null, null, startDate, endDate, null);
        };
    }

    public static PeriodFilter from(String periodTypeText, Integer month, Integer year, LocalDate startDate, LocalDate endDate, LocalDate date) {
        PeriodType periodType = parsePeriodType(periodTypeText);
        LocalDate today = LocalDate.now();

        return switch (periodType) {
            case MONTH -> {
                int resolvedYear = year == null ? today.getYear() : year;
                int resolvedMonth = month == null ? today.getMonthValue() : month;
                validateMonthYear(resolvedMonth, resolvedYear);
                LocalDate start = LocalDate.of(resolvedYear, resolvedMonth, 1);
                yield new PeriodFilter(periodType, resolvedMonth, resolvedYear, start, start.withDayOfMonth(start.lengthOfMonth()));
            }
            case WEEK -> {
                LocalDate start = startDate == null
                        ? today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                        : startDate;
                LocalDate end = endDate == null
                        ? start.plusDays(6)
                        : endDate;
                validateDateRange(start, end);
                yield new PeriodFilter(periodType, start.getMonthValue(), start.getYear(), start, end);
            }
            case DAY -> {
                LocalDate resolvedDate = date == null ? today : date;
                yield new PeriodFilter(periodType, resolvedDate.getMonthValue(), resolvedDate.getYear(), resolvedDate, resolvedDate);
            }
            case CUSTOM_RANGE -> {
                if (startDate == null || endDate == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Custom range requires startDate and endDate");
                }
                validateDateRange(startDate, endDate);
                yield new PeriodFilter(periodType, startDate.getMonthValue(), startDate.getYear(), startDate, endDate);
            }
        };
    }

    public boolean isMonthlyBudgetPeriod() {
        return periodType == PeriodType.MONTH;
    }

    private static PeriodType parsePeriodType(String value) {
        if (value == null || value.isBlank()) {
            return PeriodType.MONTH;
        }
        try {
            return PeriodType.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported periodType");
        }
    }

    private static PeriodPreset parsePeriodPreset(String value) {
        if (value == null || value.isBlank()) {
            return PeriodPreset.THIS_MONTH;
        }
        try {
            return PeriodPreset.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported periodPreset");
        }
    }

    private static void validateMonthYear(int month, int year) {
        if (month < 1 || month > 12) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Month must be between 1 and 12");
        }
        if (year < 2000 || year > 2100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Year must be between 2000 and 2100");
        }
    }

    private static void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate.isAfter(endDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "startDate must be before or equal to endDate");
        }
        if (startDate.plusYears(2).isBefore(endDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Date range cannot be longer than 2 years");
        }
    }
}
