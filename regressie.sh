{
  echo "=== test:sprint2g-b3 ==="
  npm run test:sprint2g-b3

  echo "=== test:sprint2g-b2 ==="
  npm run test:sprint2g-b2

  echo "=== test:sprint2g-b1 ==="
  npm run test:sprint2g-b1

  echo "=== test:sprint2g ==="
  npm run test:sprint2g

  echo "=== test:sprint2f ==="
  npm run test:sprint2f

  echo "=== test:sprint2d ==="
  npm run test:sprint2d
} 2>&1 | tee "logs/test-regression-2g-b3-$(date +%Y%m%d-%H%M%S).log"