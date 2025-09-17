/**
 * Stylelint Plugin for Design System Compliance
 * Enforces CSS design token usage and prevents hardcoded values
 */

const stylelint = require('stylelint');
const { report, ruleMessages, validateOptions } = stylelint.utils;

const ruleName = 'design-system/no-hardcoded-colors';
const messages = ruleMessages(ruleName, {
  expected: (unfixed, fixed) => `Expected "${fixed}" instead of "${unfixed}". Use design tokens.`,
  rejected: (value) => `Unexpected hardcoded color "${value}". Use var(--color-*) design tokens instead.`
});

const noHardcodedColorsRule = (primaryOption, secondaryOptions) => {
  return (root, result) => {
    const validOptions = validateOptions(result, ruleName, {
      actual: primaryOption
    });

    if (!validOptions) return;

    const brandColors = {
      '#3B4960': 'var(--color-primary)',
      '#F1F2F3': 'var(--color-secondary)', 
      '#28a745': 'var(--color-success)',
      '#dc3545': 'var(--color-error)',
      '#ffc107': 'var(--color-warning)',
      '#ffffff': 'var(--color-white)',
      '#000000': 'var(--color-black)'
    };

    root.walkDecls(decl => {
      // Skip if already using CSS custom properties
      if (decl.value.includes('var(--')) return;
      
      // Check for hex colors
      const hexColorRegex = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b/gi;
      const matches = decl.value.match(hexColorRegex);
      
      if (matches) {
        matches.forEach(color => {
          const normalizedColor = color.toUpperCase();
          if (brandColors[normalizedColor]) {
            report({
              message: messages.expected(color, brandColors[normalizedColor]),
              node: decl,
              result,
              ruleName
            });
          } else {
            report({
              message: messages.rejected(color),
              node: decl, 
              result,
              ruleName
            });
          }
        });
      }

      // Check for rgb/rgba colors that should be tokens
      const rgbRegex = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)/gi;
      const rgbMatches = decl.value.match(rgbRegex);
      
      if (rgbMatches) {
        rgbMatches.forEach(color => {
          report({
            message: messages.rejected(color),
            node: decl,
            result, 
            ruleName
          });
        });
      }
    });
  };
};

const useDesignTokensRule = (primaryOption) => {
  return (root, result) => {
    const validOptions = validateOptions(result, 'design-system/use-design-tokens', {
      actual: primaryOption
    });

    if (!validOptions) return;

    const properties = [
      'color',
      'background-color', 
      'border-color',
      'box-shadow',
      'text-shadow'
    ];

    root.walkDecls(decl => {
      if (properties.includes(decl.prop)) {
        // Allow only var() functions or specific keywords
        const allowedValues = ['transparent', 'inherit', 'currentColor', 'initial', 'unset'];
        const hasVar = decl.value.includes('var(--');
        const isAllowed = allowedValues.some(val => decl.value.includes(val));
        
        if (!hasVar && !isAllowed) {
          report({
            message: `Property "${decl.prop}" should use design tokens. Use var(--color-*) instead of "${decl.value}".`,
            node: decl,
            result,
            ruleName: 'design-system/use-design-tokens'
          });
        }
      }
    });
  };
};

const fontUsageRule = (primaryOption) => {
  return (root, result) => {
    const validOptions = validateOptions(result, 'design-system/font-usage', {
      actual: primaryOption
    });

    if (!validOptions) return;

    root.walkDecls('font-family', decl => {
      const hasDesignToken = decl.value.includes('var(--font-family');
      const hasOpenSans = decl.value.includes('Open Sans');
      
      if (!hasDesignToken && !hasOpenSans) {
        report({
          message: `Font family should use design tokens or "Open Sans". Found: "${decl.value}".`,
          node: decl,
          result,
          ruleName: 'design-system/font-usage'
        });
      }
    });
  };
};

module.exports = [
  stylelint.createPlugin(ruleName, noHardcodedColorsRule),
  stylelint.createPlugin('design-system/use-design-tokens', useDesignTokensRule), 
  stylelint.createPlugin('design-system/font-usage', fontUsageRule)
];

module.exports.ruleName = ruleName;
module.exports.messages = messages;