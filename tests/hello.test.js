QUnit.module('Hello Test', () => {
    QUnit.test('hello world test', assert => {
        assert.equal('Hello, World!', 'Hello, World!', 'Expected output is Hello, World!');
    });
});