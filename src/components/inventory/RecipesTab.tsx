import React from 'react'
import { Trash2 } from 'lucide-react'
import { Recipe, Product, Ingredient } from '@/types'

// ============ COLOR SCHEME ============
const colors = {
  primary: '#4318FF',
  text: '#2B3674',
  textLight: '#8F9CB8',
  border: '#E0E5F2',
  success: '#05B75D',
  error: '#F3685A',
  warning: '#FEC90F',
  background: '#F3F4F6',
}

interface RecipesTabProps {
  products: Product[]
  selectedProduct: string
  onProductChange: (productId: string) => void
  recipes: Recipe[]
  onRemoveRecipe: (recipeId: string) => void
  newIngredientForm: { ingredientid: string; amount: string }
  onFormChange: (field: string, value: string) => void
  onAddIngredient: () => void
  availableIngredients: Ingredient[]
  isSuperAdmin: boolean
}

export const RecipesTab: React.FC<RecipesTabProps> = ({
  products,
  selectedProduct,
  onProductChange,
  recipes,
  onRemoveRecipe,
  newIngredientForm,
  onFormChange,
  onAddIngredient,
  availableIngredients,
  isSuperAdmin,
}) => {
  const tableHeaderStyle = {
    backgroundColor: colors.background,
    color: colors.text,
    padding: '12px',
    textAlign: 'left' as const,
    fontWeight: '600',
    fontSize: '13px',
    borderBottom: `2px solid ${colors.border}`,
  }

  const tableCellStyle = {
    padding: '12px',
    borderBottom: `1px solid ${colors.border}`,
    color: colors.text,
    fontSize: '14px',
  }

  return (
    <div style={{ marginTop: '20px' }}>
      {/* Product Selector */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: colors.text }}>
          Chọn sản phẩm:
        </label>
        <select
          value={selectedProduct}
          onChange={e => onProductChange(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          <option value="">-- Chọn sản phẩm --</option>
          {products.map(p => (
            <option key={p.productid} value={p.productid}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {selectedProduct && (
        <>
          {/* Recipes Table */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: colors.text, marginBottom: '12px' }}>Công thức hiện có</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Nguyên liệu</th>
                  <th style={tableHeaderStyle}>Định lượng</th>
                  {isSuperAdmin && <th style={tableHeaderStyle}></th>}
                </tr>
              </thead>
              <tbody>
                {recipes.map(recipe => (
                  <tr key={recipe.recipeid}>
                    <td style={tableCellStyle}>{recipe.ingredient?.name}</td>
                    <td style={tableCellStyle}>{recipe.amount} {recipe.ingredient?.unit}</td>
                    {isSuperAdmin && (
                      <td
                        style={tableCellStyle}
                        onClick={() => recipe.recipeid && onRemoveRecipe(String(recipe.recipeid))}
                      >
                        <button
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: colors.error,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Ingredient Form - Only for Super Admin */}
          {isSuperAdmin && (
            <div
              style={{
                backgroundColor: colors.background,
                padding: '16px',
                borderRadius: '8px',
                marginTop: '20px',
              }}
            >
              <h3 style={{ color: colors.text, marginTop: 0, marginBottom: '16px' }}>Thêm nguyên liệu</h3>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>
                  Nguyên liệu:
                </label>
                <select
                  value={newIngredientForm.ingredientid}
                  onChange={e => onFormChange('ingredientid', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">-- Chọn nguyên liệu --</option>
                  {availableIngredients.map(ing => (
                    <option key={ing.ingredientid} value={ing.ingredientid}>
                      {ing.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>
                  Định lượng:
                </label>
                <input
                  type="number"
                  value={newIngredientForm.amount}
                  onChange={e => onFormChange('amount', e.target.value)}
                  placeholder="Nhập định lượng"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <button
                onClick={onAddIngredient}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Thêm
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
