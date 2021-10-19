import { screen, fireEvent } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import Bills from "../containers/Bills.js";
import Router from '../app/Router.js'
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import Firestore from "../app/Firestore";


describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {

    /**
     * Menu icon highlighted
     */
    test("Then bill icon in vertical layout should be highlighted", () => {
      // Sim global environement
      Firestore.bills = () => ({ bills, get: jest.fn().mockResolvedValue()})
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })// mock localStorage
      window.localStorage.setItem('user', JSON.stringify({type: 'Employee'}))// Set user as Employee in localStorage
      Object.defineProperty(window, "location", { value: { hash: ROUTES_PATH['Bills'] } });// Set location
      document.body.innerHTML = `<div id="root"></div>`
      Router();
      expect(screen.getByTestId('icon-window').classList.contains('active-icon')).toBe(true)
    })

    /**
     * Bills order
     */
    test("Then bills should be ordered from earliest to latest", () => {
      const html = BillsUI({ data: bills }, {formatDate: false})
      document.body.innerHTML = html
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    /**
     * Loading
     */
    describe('but it\'s loading', () => {
      test('Then i should see Loading page', () => {
        const html = BillsUI({ loading: true })
        document.body.innerHTML = html
        expect(screen.getAllByText('Loading...')).toBeTruthy()
      })
    })

    /**
     * Error
     */
    describe('but data can\'t be loaded', () => {
      test('Then i should see error page', () => {
        const html = BillsUI({ error: 'some error message' })
        document.body.innerHTML = html
        expect(screen.getAllByText('Erreur')).toBeTruthy()
      })  
    })

    /**
     * Init Bills
     */
    describe('and I click on', () => {
      let billsList;
      beforeEach(() => {
          Object.defineProperty(window, 'localStorage', { value: localStorageMock })// Set localStorage
          window.localStorage.setItem('user', JSON.stringify({type: 'Employee'}))// Set user as Employee in localStorage
          const html = BillsUI({ data: bills })
          document.body.innerHTML = html
          $.fn.modal = jest.fn()// Prevent jQuery error
          billsList = new Bills({
            document,
            onNavigate: (pathname) => document.body.innerHTML = ROUTES({ pathname }),
            firestore: null,
            localStorage: window.localStorage
          })     
      })

      /**
       * Test modal open
       */
      describe('the icon eye', () => {
        test('Then i should see a modal open', () => {
          const eye = screen.getAllByTestId('icon-eye')[0]// Get first
          const handleClickIconEye = jest.fn(billsList.handleClickIconEye(eye))      
          eye.addEventListener('click', handleClickIconEye)
          fireEvent.click(eye)
          expect(handleClickIconEye).toHaveBeenCalled()
          expect(screen.getByTestId('modaleFile')).toBeTruthy()         
        })
      })

      /**
       * Test new bill button
       */
      describe('the New Bill button', () => {
        test('Then it should display the New Bill Page', () => {
          const handleClickNewBill = jest.fn(billsList.handleClickNewBill)
          const buttonNewBill = screen.getByTestId('btn-new-bill')
          expect(buttonNewBill).toBeTruthy()
          buttonNewBill.addEventListener('click', handleClickNewBill)
          fireEvent.click(buttonNewBill)
          expect(screen.getByText('Envoyer une note de frais')).toBeTruthy() 
        })        
      })

    })

  })
})