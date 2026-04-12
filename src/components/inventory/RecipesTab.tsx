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

interface Size {
  sizeid: number | string
  name: string
  additionalprice: number
}

interface RecipesTabProps {
  products: Product[]
  sizes: Size[]
  selectedProduct: string
  selectedSize: string
  onProductChange: (productId: string) => void
  onSizeChange: (sizeId: string) => void
  recipes: Recipe[]
  onRemoveRecipe: (recipeId: string) => void
  newIngredientForm: { ingredientid: string; amount: string; sizeid: string }
  onFormChange: (field: string, value: string) => void
  onAddIngredient: () => void
  availableIngredients: Ingredient[]
  isSuperAdmin: boolean
}

export const RecipesTab: React.FC<RecipesTabProps> = ({
  products,
  sizes,
  selectedProduct,
  selectedSize,
  onProductChange,
  onSizeChange,
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

  // All recipes fetched are already filtered by selectedSize, so recipesForSize = recipes
  const recipesForSize = recipes

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
          {/* Size Selector - Show all available sizes */}
          {sizes.length > 0 && (
            <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: `1px solid ${colors.border}` }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: colors.text }}>
                Chọn Size:
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {sizes.map((size: Size) => (
                  <button
                    key={size.sizeid}
                    onClick={() => {
                      const sizeKey = String(size.sizeid)
                      console.log('[RecipesTab] Size button clicked:', sizeKey, 'sizeName:', size.name)
                      onSizeChange(sizeKey)
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: selectedSize === String(size.sizeid) ? 'none' : `2px solid ${colors.border}`,
                      backgroundColor: selectedSize === String(size.sizeid) ? colors.primary : '#fff',
                      color: selectedSize === String(size.sizeid) ? '#fff' : colors.text,
                      fontWeight: '600',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {size.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recipes Table */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: colors.text, marginBottom: '12px' }}>
              Công thức hiện có ({sizes.find(s => String(s.sizeid) === selectedSize)?.name || 'Chưa chọn'})
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Nguyên liệu</th>
                  <th style={tableHeaderStyle}>Định lượng</th>
                  {isSuperAdmin && <th style={tableHeaderStyle}></th>}
                </tr>
              </thead>
              <tbody>
                {recipesForSize.length > 0 ? (
                  recipesForSize.map((recipe: Recipe) => (
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
                  ))
                ) : (
                  <tr>
                    <td colSpan={isSuperAdmin ? 3 : 2} style={{ ...tableCellStyle, textAlign: 'center', color: colors.textLight }}>
                      Không có công thức cho size này
                    </td>
                  </tr>
                )}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>
                    Size:
                  </label>
                  <select
                    value={newIngredientForm.sizeid}
                    onChange={e => onFormChange('sizeid', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">-- Tất cả Size --</option>
                    {sizes.map(size => (
                      <option key={size.sizeid} value={size.sizeid}>
                        {size.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
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
