from fastapi import APIRouter
from src.presentation.routers import auth, users, categories, products, orders

router = APIRouter()
router.include_router(auth.router)
router.include_router(users.router)
router.include_router(categories.router)
router.include_router(products.router)
router.include_router(orders.router)
