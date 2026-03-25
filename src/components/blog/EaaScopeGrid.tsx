'use client';

import { ShoppingCart, Building2, Plane, Tv, Smartphone, Book, AlertTriangle } from 'lucide-react';

export function EaaScopeGrid() {
  return (
    <div className="my-8 p-6 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-xl border border-orange-200 dark:border-orange-800">
      <h3 className="text-xl font-bold text-center mb-6 text-orange-900 dark:text-orange-100">
        Who Falls Under the EAA?
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-orange-200 dark:border-orange-700 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">E-commerce</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Websites & mobile apps</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-orange-200 dark:border-orange-700 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Building2 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">Banking</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Online banking & payments</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-orange-200 dark:border-orange-700 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Plane className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">Transport</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ticketing & booking sites</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-orange-200 dark:border-orange-700 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Tv className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">Media</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Streaming & audiovisual</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-orange-200 dark:border-orange-700 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Smartphone className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">Telecom</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Messaging & call services</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-orange-200 dark:border-orange-700 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Book className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">Publishing</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">E-books & e-readers</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-lg border border-amber-300 dark:border-amber-700">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            <strong>Exempt:</strong> Micro-enterprises with &lt;10 employees AND &lt;€2M annual turnover
          </p>
        </div>
      </div>
    </div>
  );
}
