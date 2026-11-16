
function Calculator({
    expression,
    result,
    angleMode,
    calculating,
    error,
    onButtonClick,
    onModeChange,
    onExpressionChange
}) {

    const buttons = [
        'sin(', 'cos(', 'tan(', 'sqrt(',
        '7', '8', '9', '/',
        '4', '5', '6', '*',
        '1', '2', '3', '-',
        '0', '.', 'pi', '+',
        '(', ')', '^', 'log10(',
        'log(', '!', 'Ans', 'x²'    ];

    return (

        <div className="calculator">

            <h1>Scientific Calculator</h1>

            {/* Display */}
            <div className="display">

                
                    
<input
    type="text"
    value={expression}
    onChange={(e) => onExpressionChange(e.target.value)}
    onKeyDown={(e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onButtonClick('=');
        }

        if (e.key === 'Escape') {
            e.preventDefault();
            onButtonClick('AC');
        }
    }}
    placeholder="0"
    aria-label="Calculator expression"
/>

                

                <div className="result">
                    {calculating
                        ? 'Calculating...'
                        : error
                            ? error
                            : result !== ''
                                ? `= ${result}`
                                : ''}
                </div>

            </div>

            {/* Angle mode */}
            <button
                className="mode"
                onClick={onModeChange}
            >
                Mode: {angleMode.toUpperCase()}
            </button>

            {/* Calculator buttons */}
            <div className="buttons">

                {buttons.map((button) => (

                    <button
                        key={button}
                        onClick={() => onButtonClick(button)}
                    >
                        {button}
                    </button>

                ))}

                <button onClick={() => onButtonClick('DEL')}>
                    DEL
                </button>

                <button onClick={() => onButtonClick('AC')}>
                    AC
                </button>

                <button
                    className="equals"
                    onClick={() => onButtonClick('=')}
                    disabled={calculating}
                >
                    =
                </button>

            </div>

        </div>
    );
}

export default Calculator;
