/**
 * ESLint Plugin for Design System Compliance
 * Enforces brand guidelines and prevents common design violations
 */

const rules = {
  'no-hardcoded-colors': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Prevent hardcoded hex colors, require design tokens',
        category: 'Design System',
        recommended: true
      },
      fixable: 'code',
      schema: []
    },
    create(context) {
      const hexColorRegex = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b/g;
      const allowedColors = ['#3B4960', '#F1F2F3']; // Brand colors
      
      return {
        Literal(node) {
          if (typeof node.value === 'string') {
            const matches = node.value.match(hexColorRegex);
            if (matches) {
              matches.forEach(color => {
                if (!allowedColors.includes(color.toUpperCase())) {
                  context.report({
                    node,
                    message: `Hardcoded color "${color}" found. Use design tokens instead: var(--color-primary), var(--color-secondary), etc.`,
                    fix(fixer) {
                      const suggestions = {
                        '#3B4960': 'var(--color-primary)',
                        '#F1F2F3': 'var(--color-secondary)',
                        '#28a745': 'var(--color-success)',
                        '#dc3545': 'var(--color-error)',
                        '#ffc107': 'var(--color-warning)'
                      };
                      const replacement = suggestions[color.toUpperCase()];
                      if (replacement) {
                        return fixer.replaceText(node, `"${replacement}"`);
                      }
                    }
                  });
                }
              });
            }
          }
        },
        TemplateElement(node) {
          const matches = node.value.raw.match(hexColorRegex);
          if (matches) {
            matches.forEach(color => {
              if (!allowedColors.includes(color.toUpperCase())) {
                context.report({
                  node,
                  message: `Hardcoded color "${color}" found in template literal. Use design tokens instead.`
                });
              }
            });
          }
        }
      };
    }
  },

  'button-variant-compliance': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Enforce filled button variants only',
        category: 'Design System',
        recommended: true
      },
      fixable: 'code',
      schema: []
    },
    create(context) {
      return {
        JSXElement(node) {
          if (node.openingElement.name.name === 'Button' || 
              node.openingElement.name.name === 'MuiButton') {
            
            const variantAttr = node.openingElement.attributes.find(
              attr => attr.name && attr.name.name === 'variant'
            );
            
            if (variantAttr && variantAttr.value) {
              const variant = variantAttr.value.value;
              if (variant === 'outlined' || variant === 'text') {
                context.report({
                  node: variantAttr,
                  message: `Button variant "${variant}" not allowed. Use "contained" for filled buttons.`,
                  fix(fixer) {
                    return fixer.replaceText(variantAttr.value, '"contained"');
                  }
                });
              }
            }
          }
        }
      };
    }
  },

  'icon-type-compliance': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Enforce Material Icons Outlined only',
        category: 'Design System',
        recommended: true
      },
      fixable: 'code',
      schema: []
    },
    create(context) {
      return {
        ImportDeclaration(node) {
          if (node.source.value === '@mui/icons-material') {
            node.specifiers.forEach(specifier => {
              if (specifier.type === 'ImportSpecifier') {
                const iconName = specifier.imported.name;
                if (!iconName.endsWith('Outlined')) {
                  context.report({
                    node: specifier,
                    message: `Icon "${iconName}" should use Outlined variant. Import "${iconName.replace(/(Filled|TwoTone|Round|Sharp)?$/, '')}Outlined" instead.`,
                    fix(fixer) {
                      const outlinedName = iconName.replace(/(Filled|TwoTone|Round|Sharp)?$/, '') + 'Outlined';
                      return fixer.replaceText(specifier.imported, outlinedName);
                    }
                  });
                }
              });
            });
          }
        }
      };
    }
  },

  'text-casing-compliance': {
    meta: {
      type: 'suggestion',
      docs: {
        description: 'Enforce sentence case text (no Title Case or UPPERCASE)',
        category: 'Design System',
        recommended: true
      },
      fixable: 'code',
      schema: []
    },
    create(context) {
      function isTitleCase(text) {
        return /^[A-Z][a-z]+(\s[A-Z][a-z]+)*$/.test(text);
      }
      
      function isUpperCase(text) {
        return text === text.toUpperCase() && text !== text.toLowerCase();
      }
      
      function toSentenceCase(text) {
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
      }
      
      return {
        Literal(node) {
          if (typeof node.value === 'string' && node.value.length > 1) {
            const text = node.value.trim();
            if (isTitleCase(text) || isUpperCase(text)) {
              context.report({
                node,
                message: `Text "${text}" should use sentence case. Consider: "${toSentenceCase(text)}"`,
                fix(fixer) {
                  return fixer.replaceText(node, `"${toSentenceCase(text)}"`);
                }
              });
            }
          }
        }
      };
    }
  }
};

module.exports = {
  rules,
  configs: {
    recommended: {
      plugins: ['design-system'],
      rules: {
        'design-system/no-hardcoded-colors': 'error',
        'design-system/button-variant-compliance': 'error', 
        'design-system/icon-type-compliance': 'error',
        'design-system/text-casing-compliance': 'warn'
      }
    }
  }
};