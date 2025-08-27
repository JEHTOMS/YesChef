# YesChef - Food AI Recipe App

A modern React-based food recipe application with AI-powered ingredient management and store locator functionality.

## Features

- **Interactive Ingredient Lists**: Check off ingredients with custom styled checkboxes
- **Segmented Controls**: Smooth animated toggle between Ingredients and Directions
- **Store Locator Modal**: Find nearby stores with phone contact and distance information
- **Responsive Design**: Mobile-first responsive UI
- **Modern Animations**: Smooth modal transitions with custom bezier curves
- **Component-Based Architecture**: Reusable React components

## Tech Stack

### Frontend
- **React 19.1.1**: Modern React with hooks
- **CSS3**: Custom animations and responsive design
- **Component Architecture**: Modular, reusable components

## Project Structure

```
food-ai/
├── public/
│   ├── index.html
│   └── assets/
├── src/
│   ├── components/
│   │   ├── Button.jsx          # Flexible button component
│   │   ├── Footer.jsx          # App footer with action buttons
│   │   ├── Ingredients.jsx     # Interactive ingredient list
│   │   ├── Navbar.jsx          # Navigation bar
│   │   └── Stores.jsx          # Store locator modal
│   ├── pages/
│   │   ├── Home.jsx            # Landing page
│   │   ├── FoodInformation.jsx # Main food info page
│   │   └── FoodOverview.jsx    # Food overview page
│   ├── styles/
│   │   ├── Home.css
│   │   ├── FoodInfo.css        # Main styles with modal animations
│   │   └── Stores.css          # Store component styles
│   └── index.js
└── package.json
```

## Key Components

### Store Modal
- Slide-in animation from bottom (150ms)
- 4 sample UK stores with contact info
- Click outside to close
- Smooth bezier curve animations

### Interactive Ingredients
- Custom checkbox styling with SVG checkmarks
- Hover effects and transitions
- Dynamic quantity and unit display
- Component-based rendering

### Segmented Controls
- Smooth sliding background animation
- Toggle between Ingredients/Directions
- CSS-based state management

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jehtoms/YesChef.git
   cd YesChef
   ```

2. **Install dependencies**
   ```bash
   cd food-ai
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```
   The app will run on `http://localhost:3001`

## Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## Features in Detail

### Modal System
- **Overlay**: 25% black background with fade animations
- **Content**: Centered modal with slide transitions
- **Interactions**: Close via X button or outside clicks
- **Timing**: Synchronized 150ms animations

### Store Data
- **Sainsbury's Local**: 0.1 miles - 0333 123 4567
- **Tesco Express**: 0.3 miles - 0345 167 7890
- **ASDA Superstore**: 0.5 miles - 0800 123 4567
- **Morrisons**: 0.7 miles - 0870 111 2234

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License.
