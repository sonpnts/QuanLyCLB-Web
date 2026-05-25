import RoleGuard from '@/hocs/RoleGuard'
import ProductBundleView from '@views/apps/product/bundles'

const ProductBundlePage = () => (
  <RoleGuard>
    <ProductBundleView />
  </RoleGuard>
)

export default ProductBundlePage
