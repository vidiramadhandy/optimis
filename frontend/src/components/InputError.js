const InputError = ({ messages = [], className = '' }) => (
    <>
        {messages.length > 0 && (
            <>
                {messages.map((message) => (
                    <p
                        className={` text-sm text-red-600`}
                        >
                        {message}
                    </p>
                ))}
            </>
        )}
    </>
)

export default InputError