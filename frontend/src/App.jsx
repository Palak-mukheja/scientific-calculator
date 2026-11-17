
import { useState, useEffect } from 'react';

import Calculator from './components/Calculator';
import History from './components/History';

import './App.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
   
const handleExpressionChange = (value) => {
    setExpression(value);
    setResult('');
    setCalcError('');
};

    // Calculator states
    const [expression, setExpression] = useState('');
    const [result, setResult] = useState('');
    const [angleMode, setAngleMode] = useState('deg');
    const [lastAnswer, setLastAnswer] = useState('');
    

    // History states
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [historyError, setHistoryError] = useState('');

    // Calculation states
    const [calculating, setCalculating] = useState(false);
    const [calcError, setCalcError] = useState('');

    // Fetch history when application loads
    useEffect(() => {

        const loadHistory = async () => {

            try {
                const response = await fetch(`${API}/history`);

                if (!response.ok) {
                    throw new Error('Failed to load history');
                }

                const data = await response.json();
                setHistory(data);

            } catch (error) {
                setHistoryError('Could not load history');
                console.error(error);

            } finally {
                setLoading(false);
            }
        };

        loadHistory();

    }, []);

    // Calculate expression using backend
    const calculateExpression = async () => {

        if (!expression.trim()) return;

        setCalculating(true);
        setCalcError('');

        try {

            const response = await fetch(`${API}/calculate`, {

                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    expression: expression,
                    angleMode: angleMode
                })

            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Calculation failed');
            }

            // Display the result
            setResult(data.result);
            setLastAnswer(String(data.result));

            // Refresh history
            const historyResponse = await fetch(`${API}/history`);

            if (historyResponse.ok) {
                const historyData = await historyResponse.json();
                setHistory(historyData);
            }

        } catch (error) {

            setCalcError(error.message);

        } finally {

            setCalculating(false);

        }
    };

    
// Delete one calculation
const deleteOne = async (id) => {

    try {

        const response = await fetch(`${API}/history/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Could not delete calculation');
        }

        // Remove the deleted calculation from React state
        setHistory((prev) =>
            prev.filter((item) => item.id !== id)
        );

        setHistoryError('');

    } catch (error) {

        setHistoryError(error.message);

    }
};


// Clear all calculations
const clearAll = async () => {

    if (history.length === 0) return;

    const confirmed = window.confirm(
        'Are you sure you want to delete all history?'
    );

    if (!confirmed) return;

    try {

        const response = await fetch(`${API}/history`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Could not clear history');
        }

        // Clear React state
        setHistory([]);

        setHistoryError('');

    } catch (error) {

        setHistoryError(error.message);

    }
};


    // Handle calculator buttons
    const handleClick = (value) => {

        if (value === 'AC') {

            setExpression('');
            setResult('');
            setCalcError('');

        } else if (value === 'DEL') {

            setExpression((prev) => prev.slice(0, -1));

        } else if (value === '=') {

            calculateExpression();

        }else if (value === 'Ans') {
    if (lastAnswer !== '') {
        setExpression((prev) => prev + lastAnswer);
    }
}

         else {

            setExpression((prev) => prev + value);
            setResult('');
            setCalcError('');

        }
    };

    // Switch between degree and radian mode
    const toggleAngleMode = () => {

        setAngleMode((prev) =>
            prev === 'deg' ? 'rad' : 'deg'
        );

    };

    return (

        <div className="app">

            <Calculator
                expression={expression}
                result={result}
                angleMode={angleMode}
                calculating={calculating}
                error={calcError}
                onButtonClick={handleClick}
                onModeChange={toggleAngleMode}
                onExpressionChange={handleExpressionChange}
            />

            <History
    items={history}
    loading={loading}
    error={historyError}
    onDelete={deleteOne}
    onClear={clearAll}
/>

        </div>

    );
}

export default App;
