/* globals describe it */

let assert = require('assert')

describe('Chapter 04', () => {
  describe('4.1 Exploring JavaScript with Unit Tests', function () {
    describe('Array#splice()', function () {
      it('should modify array', function () {
        let arr = [1, 2, 3, 4, 5]
        arr.splice(2, 3)
        assert.deepStrictEqual(arr, [1, 2])
      })

      it('should return removed items from array', function () {
        let arr = [1, 2, 3, 4, 5]
        let result = arr.splice(2, 3)
        assert.deepStrictEqual(result, [3, 4, 5])
      })
    })
  })
})
