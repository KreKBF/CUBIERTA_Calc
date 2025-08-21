import { Routes, Route, Navigate } from 'react-router-dom';
import DeckAreaCalculator from './DeckAreaCalculator';
import StartForm from './StartForm';


export default function App() {
return (
<Routes>
<Route path="/" element={<Navigate to="/calc" replace />} />
<Route path="/calc" element={<DeckAreaCalculator />} />
<Route path="/start" element={<StartForm />} />
<Route path="*" element={<Navigate to="/calc" replace />} />
</Routes>
);
}
