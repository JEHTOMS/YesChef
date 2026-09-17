import { fireEvent, render, screen } from '@testing-library/react';
import NewNavbar from './NewNavbar';

test('recipe pages replace Sign up with Save recipe and retain Sign in', () => {
    const save = jest.fn();
    render(<NewNavbar showCreditsButton showAuthButtons onSaveRecipe={save} />);
    expect(screen.queryByRole('button', { name: 'Sign up' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save recipe' }));
    expect(save).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Unsave recipe' })).not.toBeInTheDocument();
});

test('home keeps the existing sign-up action', () => {
    render(<NewNavbar showAuthButtons />);
    expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save recipe' })).not.toBeInTheDocument();
});

test('saving is disabled and confirmed saved state opens unsave', () => {
    const unsave = jest.fn();
    const { rerender } = render(<NewNavbar showCreditsButton isSaving />);
    expect(screen.getByRole('button', { name: 'Saving recipe' })).toBeDisabled();
    rerender(<NewNavbar showCreditsButton isRecipeSaved onUnsaveRecipe={unsave} />);
    fireEvent.click(screen.getByRole('button', { name: 'Unsave recipe' }));
    expect(unsave).toHaveBeenCalledTimes(1);
});

test('free accounts can see the credit cost', () => {
    render(<NewNavbar showCreditsButton credits={6} />);
    expect(screen.getByRole('button', { name: 'Save recipe' })).toHaveTextContent('6 cr.');
});
