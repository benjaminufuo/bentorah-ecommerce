import React from 'react';
import './CheckoutProgress.css';

const CheckoutProgress = ({ currentStep, isAuthenticated, onStepClick }) => {
  const steps = [
    { id: 1, key: 'account', label: 'Account' },
    { id: 2, key: 'delivery', label: 'Delivery' },
    { id: 3, key: 'review', label: 'Review' },
    { id: 4, key: 'payment', label: 'Payment' },
  ];

  return (
    <nav className="checkout-progress" aria-label="Checkout Progress">
      <ol className="checkout-progress__list">
        {steps.map((s, index) => {
          // If authenticated, step 1 is permanently completed
          const isDone = (s.id === 1 && isAuthenticated && currentStep > 1) || currentStep > s.id;
          const isActive = currentStep === s.id;
          const isClickable = onStepClick && (isDone || (s.id === 2 && isAuthenticated));

          return (
            <li
              key={s.key}
              className={`checkout-progress__item ${
                isActive ? 'checkout-progress__item--active' : ''
              } ${isDone ? 'checkout-progress__item--done' : ''}`}
            >
              <button
                type="button"
                className="checkout-progress__button"
                onClick={() => isClickable && onStepClick(s.id)}
                disabled={!isClickable}
                aria-current={isActive ? 'step' : undefined}
              >
                <span className="checkout-progress__circle">
                  {isDone ? (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    s.id
                  )}
                </span>
                <span className="checkout-progress__label">
                  {s.label}
                  {s.id === 1 && isAuthenticated && (
                    <span className="checkout-progress__sub">Signed in</span>
                  )}
                </span>
              </button>

              {index < steps.length - 1 && (
                <div
                  className={`checkout-progress__connector ${
                    isDone ? 'checkout-progress__connector--done' : ''
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default CheckoutProgress;
