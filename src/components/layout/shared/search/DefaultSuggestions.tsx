// Next Imports
import Link from 'next/link'

// Third-party Imports
import classnames from 'classnames'

// Type Imports

// Util Imports

type DefaultSuggestionsType = {
  sectionLabel: string
  items: {
    label: string
    href: string
    icon?: string
  }[]
}

const defaultSuggestions: DefaultSuggestionsType[] = [
  {
    sectionLabel: 'Chức năng',
    items: [
      {
        label: 'Điểm danh',
        href: '/apps/check-in',
        icon: 'ri-checkbox-circle-line'
      },
      {
        label: 'Lịch dạy',
        href: '/apps/my-schedule',
        icon: 'ri-calendar-line'
      },
      {
        label: 'Xin nghỉ phép',
        href: '/apps/request-leave',
        icon: 'ri-file-paper-2-line'
      },
      {
        label: 'Tạo phiếu điểm danh bù',
        href: '/apps/create-ticket',
        icon: 'ri-file-add-line'
      },
      {
        label: 'Lịch sử phiếu',
        href: '/apps/my-tickets',
        icon: 'ri-file-list-line'
      },
      {
        label: 'Bảng lương',
        href: '/apps/my-payroll',
        icon: 'ri-money-dollar-circle-line'
      }
    ]
  }
]

const DefaultSuggestions = ({ setOpen }: { setOpen: (value: boolean) => void }) => {
  // Hooks
  return (
    <div className='flex grow flex-wrap gap-x-[48px] gap-y-8 plb-14 pli-16 overflow-y-auto overflow-x-hidden bs-full'>
      {defaultSuggestions.map((section, index) => (
        <div
          key={index}
          className='flex flex-col justify-center overflow-x-hidden gap-4 basis-full sm:basis-[calc((100%-3rem)/2)]'
        >
          <p className='text-xs leading-[1.16667] uppercase text-textDisabled tracking-[0.8px]'>
            {section.sectionLabel}
          </p>
          <ul className='flex flex-col gap-4'>
            {section.items.map((item, i) => (
              <li key={i} className='flex'>
                <Link
                  href={item.href}
                  className='flex items-center overflow-x-hidden cursor-pointer gap-2 hover:text-primary focus-visible:text-primary focus-visible:outline-0'
                  onClick={() => setOpen(false)}
                >
                  {item.icon && <i className={classnames(item.icon, 'flex text-xl')} />}
                  <p className='text-[15px] leading-[1.4667] truncate'>{item.label}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export default DefaultSuggestions
