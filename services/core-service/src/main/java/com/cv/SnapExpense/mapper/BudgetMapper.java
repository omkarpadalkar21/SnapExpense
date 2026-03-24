package com.cv.SnapExpense.mapper;

import com.cv.SnapExpense.dto.GetBudgetResponse;
import com.cv.SnapExpense.model.MonthlyBudget;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface BudgetMapper {

    @Mapping(target = "categoryId", source = "category.id")
    @Mapping(target = "categoryName", source = "category.name")
    GetBudgetResponse toGetBudgetResponse(MonthlyBudget budget);
}
