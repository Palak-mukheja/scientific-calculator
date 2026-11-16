
function History({ items, loading, error, onDelete, onClear }) {

    return (

        <div className="history">

            <div className="history-header">

                <h2>Calculation History</h2>

                {items.length > 0 && (
                    <button onClick={onClear}>
                        Clear all
                    </button>
                )}

            </div>

            {loading && <p>Loading history...</p>}

            {error && <p>{error}</p>}

            {!loading && items.length === 0 && (
                <p>No calculations yet.</p>
            )}

            {!loading && items.length > 0 && (

                <ul>

                    {items.map((item) => (

                        <li key={item.id}>

                            <div className="history-item">

                                <strong>{item.expression}</strong>

                                <p>= {item.result}</p>

                                <small>
                                    {item.angle_mode.toUpperCase()}
                                    {' · '}
                                    {new Date(
                                        item.created_at
                                    ).toLocaleString()}
                                </small>

                            </div>

                            <button
                                className="delete-button"
                                onClick={() => onDelete(item.id)}
                            >
                                Delete
                            </button>

                        </li>

                    ))}

                </ul>

            )}

        </div>

    );
}

export default History;
